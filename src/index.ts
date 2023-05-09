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


function updateWeatherUI(weatherData: WeatherData | null): void {
    (document.querySelector(".weather") as HTMLElement).style.display =
      weatherData ? "block" : "none";
    (document.querySelector(".error") as HTMLElement).style.display = weatherData
      ? "none"
      : "block";
  
    if (weatherData) {
      (document.querySelector(".city") as HTMLElement).innerHTML =
        weatherData.geolocation.name;
      (document.querySelector(".district") as HTMLElement).innerHTML =
        weatherData.geolocation.district;
  
      (document.querySelector(".temp") as HTMLElement).innerHTML =
        weatherData.temp;
      (document.querySelector(".feuchtigkeit") as HTMLElement).innerHTML =
        weatherData.humidity;
      (document.querySelector(".windgeschwindigkeit") as HTMLElement).innerHTML =
        weatherData.windspeed;
      (document.querySelector(".weather-icon") as HTMLImageElement).src =
        weatherData.weatherIcon;
    }
  }
  
  function between(x: number, min: number, max: number): boolean {
    return x >= min && x <= max;
  }
  
  function getWeatherIcon(weatherCode: number): string {
    if (weatherCode === 0) return "Bilder/sonne.png";
    else if (between(weatherCode, 1, 3)) return "Bilder/wolke.png";
    else if (between(weatherCode, 45, 48)) return "Bilder/wolkig.png";
    else if (between(weatherCode, 51, 57)) return "Bilder/wolkig.png";
    else if (between(weatherCode, 61, 67) || between(weatherCode, 80, 82))
      return "Bilder/regnerisch.png";
    else if (between(weatherCode, 95, 99)) return "Bilder/sturm.png";
    else if (between(weatherCode, 71, 77) || between(weatherCode, 85, 86))
      return "Bilder/schneebedeckt.png";
    else return "";
}

//prüft ob Daten von der API geholt werden oder schon gespeicherte Daten verwendet werden können
async function getWeatherDataAndStore(
    geolocation: GeolocationResult
  ): Promise<WeatherData | null> {
    localStorage.setItem("lastSearchedCity", JSON.stringify(geolocation));
  
    const storedData = localStorage.getItem(geolocation.countryId.toString());
    let weatherStorageData: WeatherStorageData = storedData
      ? JSON.parse(storedData)
      : null;
  
    const storedDataValid: boolean =
      weatherStorageData &&
      new Date().getTime() - weatherStorageData.timeStamp <
        storageTimeOutInMinutes * 60000;
  
    if (storedDataValid) {
      console.log("getting data from storage"); //remove later
      return weatherStorageData.weatherData;
    } else {
      const weatherData = await getWeatherDataFromApi(geolocation);
      if (weatherData) {
        console.log("adding data to storage"); //remove later
        const weatherStorageData: WeatherStorageData = {
          timeStamp: new Date().getTime(),
          weatherData: weatherData,
        };
        localStorage.setItem(
          geolocation.countryId.toString(),
          JSON.stringify(weatherStorageData)
        );
        return weatherData;
      } else {
        return null;
      }
    }
}

async function onCitySelected(result: GeolocationResult): Promise<void> {
    const weatherData = await getWeatherDataAndStore(result);
    updateWeatherUI(weatherData);
  }
  
  async function getGeolocationResultsFromInput(
    typedValue: string
  ): Promise<GeolocationResult[] | null> {
    const result = await getGeolocationFromApi(typedValue);
    if (result) {
      return getGeolocationResults(result);
    }
    return null;
}

async function searchInputListener(): Promise<void> {
    const city = searchInput.value;
    listParent.style.display = "block";
  
    try{
  
    const geolocationResults = await getGeolocationResultsFromInput(city);
    const filteredGeolocationResults = geolocationResults?.filter((x) =>
          x.name.toLocaleLowerCase().startsWith(city.toLocaleLowerCase())
        );
      if (filteredGeolocationResults && filteredGeolocationResults.length > 0) {
        
        let index: number = 0;
        const childNodeCount: number = listParent.childElementCount;
  
        for (let element of filteredGeolocationResults) {
          const node: HTMLButtonElement =
            index === 0
              ? listElement
              : index < childNodeCount
              ? (listParent.children[index] as HTMLButtonElement)
              : (listElement.cloneNode(true) as HTMLButtonElement);
  
          node.textContent = stringifyGeolocation(element);
  
          node.onclick = () => {
            searchInput.value = node.textContent as string;
            listParent.style.display = "none";
  
            onCitySelected(element);
          };
  
          if (index >= childNodeCount) listParent.appendChild(node);
          index++;
        }
  
        
          if (childNodeCount > index) {
            for (let i = index; i < childNodeCount; i++) {
              listParent.removeChild(listParent.lastElementChild as HTMLElement);
            }
          }
        }
        else{
          showNotFoundResult();
        }
      }catch(e){
        showNotFoundResult();
      }
}

function showNotFoundResult() {
    if (listParent.childElementCount > 1) {
      for (let i = 0; i < listParent.childElementCount - 1; i++) {
        listParent.removeChild(listParent.lastElementChild as HTMLElement);
      }
    }
    listElement.textContent = "Keine Ergebnisse gefunden."; //Todo -> auch wenn liste leer
    listElement.onclick = () => {};
}

function loadLastSearchedContent(): void {
    var storedData = localStorage.getItem("lastSearchedCity");
    if (storedData) {
      try {
        var data: GeolocationResult = JSON.parse(storedData);
        searchInput.value = stringifyGeolocation(data);
        onCitySelected(data);
      } catch (e) {}
    }
  }
  