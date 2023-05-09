//THIS IS THE ENTRY FILE - WRITE YOUR MAIN LOGIC HERE!
const storageTimeOutInMinutes: number = 10;


const geocodingUrl: string = "https://geocoding-api.open-meteo.com/v1/search";
const countOfCitySuggestions: number = 10;
const languageFormat: string = "de";

const lastSearchedCityStorageKey ='lastSearchedCity';


const searchInput = document.querySelector("#searchInput") as HTMLInputElement;
const suggestionsListElement = document.querySelector(
  ".searchListItem"
) as HTMLButtonElement;
const suggestionsListContainer = document.querySelector(".searchListGroup") as HTMLElement;

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
  
    const storedData = localStorage.getItem(geolocation.countryId.toString());
    let weatherStorageData: WeatherStorageData = storedData
      ? JSON.parse(storedData)
      : null;
  
    const storedDataValid: boolean =
      weatherStorageData &&
      new Date().getTime() - weatherStorageData.timeStamp <
        storageTimeOutInMinutes * 60000;
  
    if (storedDataValid) {
    localStorage.setItem(lastSearchedCityStorageKey, JSON.stringify(geolocation));
      return weatherStorageData.weatherData;
    } else {
      const weatherData = await getWeatherDataFromApi(geolocation);
      if (weatherData) {
        const weatherStorageData: WeatherStorageData = {
          timeStamp: new Date().getTime(),
          weatherData: weatherData,
        };
        localStorage.setItem(lastSearchedCityStorageKey, JSON.stringify(geolocation));
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

async function fillCitySuggestionList(): Promise<void> {
    const city = searchInput.value;
    suggestionsListContainer.style.display = 'block';
  
    const geolocationResults = await getGeolocationResultsFromInput(city);
    //filter the results so that the selection matches our creteria
    const filteredGeolocationResults = geolocationResults?.filter((x) =>
      x.name.toLocaleLowerCase().startsWith(city.toLocaleLowerCase())
    );
    if (filteredGeolocationResults && filteredGeolocationResults.length > 0) {
      let index: number = 0;
      const childElementCount: number = suggestionsListContainer.childElementCount;
  
      for (let element of filteredGeolocationResults) {
        const node: HTMLButtonElement =
          index === 0
          //remain the first element and reuse it
            ? suggestionsListElement
            //if there is an existing child, reuse it for performance issues
            : index < childElementCount ? suggestionsListContainer.children[index] as HTMLButtonElement
            //if there are no more children existing, create a new
            : (suggestionsListElement.cloneNode(true) as HTMLButtonElement);
  
        node.textContent = stringifyGeolocation(element);
  
        setListItemClickEvent(node, element);
  
        if (index > 0) {
          suggestionsListContainer.appendChild(node);
        }
        index++;
      }
  
      //sometimes there where more cildren before this search. Remove the unused elements
      for(let i = childElementCount -1; i>=index; i--){
        suggestionsListContainer.removeChild(suggestionsListContainer.lastElementChild as HTMLButtonElement);
      }
  
    } else {
      showNotFoundResult();
    }
  }
  
  function setListItemClickEvent(
    button: HTMLButtonElement,
    value: GeolocationResult
  ) {
    button.onclick = () => {
      searchInput.value = button.textContent as string;
      suggestionsListContainer.style.display = 'none';
      onCitySelected(value);
    };
}

function cleanUpChildren(parentNode: HTMLElement, except: HTMLElement) {
    for (let i = parentNode.childElementCount - 1; i >= 0; i--) {
      const child = parentNode.children[i] as HTMLElement;
      if (child !== except) {
        parentNode.removeChild(parentNode.lastElementChild as HTMLElement);
      }
    }
}

function showNotFoundResult() {
    cleanUpChildren(suggestionsListContainer, suggestionsListElement);
    suggestionsListElement.textContent = 'Keine Ergebnisse gefunden.';
    suggestionsListElement.onclick = () => {};
}

function stringifyGeolocation(location: GeolocationResult): string{
    return `${location.countryCode} ${location.name} Landkreis: ${location.district} Region: ${location.region}`;
}
function loadLastSearchedContent(): void {
    var storedData = localStorage.getItem("lastSearchedCity");
    if (storedData) {
      try {
        var data: GeolocationResult = JSON.parse(storedData);
        searchInput.value = stringifyGeolocation(data);
        onCitySelected(data);
      } catch (e) {
        console.log(e);
      }
    }
}

function addEventListeners(): void {
    searchInput.addEventListener("input", searchInputListener);
    searchInput.onclick = () => (searchInput.value = "");
    //clear input, wenn unfocusing the searchbar
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addEventListeners);
  } else {
    addEventListeners();
    loadLastSearchedContent();
  }
  