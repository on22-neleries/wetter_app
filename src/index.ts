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

//ruft die API auf und sucht nach passenden Ergebnissen zu der Eingabe im Suchfeld
async function getGeolocationFromApi(city: string): Promise<string | null> {
    let response = await fetch(
      `${geocodingUrl}?name=${city}&count=${countOfCitySuggestions}&language=${languageFormat}&format=json`
    );
    if (response.status === 200) {
      return response.json();
    } else {
      console.log(
        "An error occured during api call. Response: " + response.status
      );
      return null;
    }
}

//stores the api responses into an array of geolocations
function getGeolocationResults(jsonData: any): GeolocationResult[] {
    let results: GeolocationResult[] = new Array();
  
    for (let elem of jsonData.results) {
      results.push({
        district: elem.admin1,
        countryCode: elem.country_code,
        latitude: elem.latitude,
        longitude: elem.longitude,
        name: elem.name,
        timeZone: elem.timeZone,
        countryId: elem.id,
        region: elem.admin2,
      });
    }
    return results;
  }

  async function getWeatherDataFromApi(
    city: GeolocationResult
  ): Promise<WeatherData | null> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.latitude}&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,weathercode`;
  
    let response = await fetch(url);
  
    if (response.status === 200) {
      const data = await response.json();
  
      var currentHour = new Date().getHours();
      //find the current hour
      const index = data.hourly.time.findIndex((item: string) => {
        const date = new Date(item);
        return date.getHours() === currentHour;
      });
  
      const weatherData: WeatherData = {
        geolocation: city,
        temp: Math.round(data.hourly.temperature_2m[index]) + "°C",
        humidity: data.hourly.relativehumidity_2m[index] + "%",
        windspeed: data.hourly.windspeed_10m[index] + " km/h",
        weatherIcon: getWeatherIcon(data.hourly.weathercode[index]),
      };
      return weatherData;
    } else {
      return null;
    }
  }