/* eslint-disable @lwc/lwc/no-async-await */
import { LightningElement, api, wire, track } from 'lwc';
import returnCountries from '@salesforce/apex/TransferAccessInterface.returnCountries';
import returnCities from '@salesforce/apex/TransferAccessInterface.returnCities';
import returnAccountWrappers from '@salesforce/apex/TransferAccessInterface.returnAccountWrappers';
import setAssetWrapper from '@salesforce/apex/TransferAccessInterface.setAssetWrapper';
import { RefreshEvent } from 'lightning/refresh';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

const columns = [
    { label: 'Account', fieldName: 'accountName' },
    { label: 'City', fieldName: 'accountCity' },
    { label: 'State', fieldName: 'accountState' }
];

export default class TransferAsset extends LightningElement {
    @api recordId;
    error;
    countryOptions;
    countryValue;
    cityOptions;
    accountData;
    accountValue;
    columns = columns;
    citiesAreLoaded = false;
    transferDisabled = true;

    
    @wire(returnCountries)
    wiredCountries({error, data}) {
        if (data) {
            this.countryOptions = JSON.parse(data);
            this.error = undefined;

            console.log(this.countryOptions);
        } else if (error) {
            this.error = error;
            this.countryOptions = undefined;
            console.log(error);
        }
    }

    resetForm() {
        this.countryValue = undefined;
        this.cityOptions = null;
        this.accountData = null;
        this.citiesAreLoaded = false;
        this.dispatchEvent(new RefreshEvent());
    }

    handleCountryChange(event) {
        this.countryValue = event.target.value;
        this.cityOptions = null;
        this.accountData = null;
        this.getCities(this.countryValue);
    }

    handleCityChange(event) {
        let cityValue = event.target.value;
        this.getAccounts(cityValue);
    }
    
    async getCities(countryValue) {
        try {
            const cities = await returnCities({countryName : countryValue});
            this.cityOptions = JSON.parse(cities);
            this.error = undefined;
            this.citiesAreLoaded = true;
        } catch (error) {
            this.error = error;
            this.cityOptions = undefined;
            this.showNotif('There has been an error!', error.message, 'error');
        }
    }

    async getAccounts(cityValue) {
        try {
            const accounts = await returnAccountWrappers({cityName : cityValue});
            this.accountData = JSON.parse(accounts);
            this.error = undefined;
        } catch(error) {
            this.accountData = undefined;
            this.error = error;
            this.showNotif('There has been an error!', error.message, 'error');
        }
    }

    setAccountId(event) {
        this.accountValue = event.detail.selectedRows[0].accountId;
        this.transferDisabled = false;
    }

    async transferAsset() {
        try {
            await setAssetWrapper({assetId : this.recordId, accountId : this.accountValue});
            this.resetForm();
        } catch(error) {
            this.error = error;
            this.showNotif('There has been an error!', error.message, 'error');
        }
    }

    showNotif(title, msg, variant) {
        const evt = new ShowToastEvent({
          title: title,
          message: msg,
          variant: variant,
        });
        this.dispatchEvent(evt);
    }
}