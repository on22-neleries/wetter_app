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