//THIS IS THE ENTRY FILE - WRITE YOUR MAIN LOGIC HERE!
import { listenerCount } from "process";
import { createVoidZero } from "../node_modules/typescript/lib/typescript";

const storageTimeOutInMinutes: number = 0.5;

const geocodingUrl: string = "https://geocoding-api.open-meteo.com/v1/search";
const countOfCitySuggestions: number = 10;
const languageFormat: string = "de";
const searchInput = document.querySelector("#searchInput") as HTMLInputElement;

const listElement = document.querySelector(
  ".searchListItem"
) as HTMLButtonElement;
const listParent = document.querySelector(".searchListGroup") as HTMLElement;

interface WeatherData {
    geolocation: GeolocationResult;
    temp: string;
    humidity: string;
    windspeed: string;
    weatherIcon: string;
}

interface WeatherStorageData {
weatherData: WeatherData;
timeStamp: number;
}

interface GeolocationResult {
    district: string;
    countryCode: string;
    latitude: string;
    longitude: string;
    name: string;
    timeZone: string;
    countryId: number;
    region: string;
}