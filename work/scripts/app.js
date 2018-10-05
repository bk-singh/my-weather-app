/* Weather Report PWA Application JS file */

(function() {
  "use strict";

  var app = {
    isLoading: true,
    visibleCards: {},
    selectedCities: [],
    spinner: document.querySelector(".loader"),
    cardTemplate: document.querySelector(".cardTemplate"),
    container: document.querySelector(".main"),
    addDialog: document.querySelector(".dialog-container"),
    daysOfWeek: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    cities: [ 'Agra', 'Ahmedabad', 'Aizawl', 'Allahabad', 'Alleppey', 'Amritsar', 'Bengaluru', 'Bhubaneswar', 'Chennai', 'Cochin', 'Darjeeling', 'Dehradun', 'Delhi', 'Durgapur', 'Ghaziabad', 'Gorakhpur', 'Gurugram', 'Guwahati', 'Haridwar', 'Hyderabad', 'Jaipur', 'Jaisalmer', 'Jodhpur', 'Kanpur', 'Kodaikanal', 'Kanyakumari', 'Kohima', 'Kolkata', 'Ladakh', 'Lakshadweep', 'Lonavala', 'Lucknow', 'Madgaon', 'Madurai', 'Meerut', 'Mirzapur', 'Mumbai', 'Munnar', 'Mysore', 'Nagpur', 'Nainital', 'New Delhi', 'Ooty', 'Raipur', 'Rameshwaram', 'Salem', 'Shimla', 'Sikkim', 'Srinagar', 'Surat', 'Tiruchirappalli', 'Tirupati', 'Panaji', 'Patna', 'Port Blair', 'Puducherry', 'Pune', 'Udaipur', 'Varanasi', 'Vasco Da Gama', 'Visakhapatnam', 'Warangal']
  };

  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

  document.getElementById("butRefresh").addEventListener("click", function() {
    // Refresh all of the forecasts
    app.updateForecasts();
  });

  document.getElementById("butAdd").addEventListener("click", function() {
    // Open/show the add new city dialog
    app.toggleAddDialog(true);
  });

(function() {
    var x = document.getElementById("selectCityToAdd");
    app.cities.forEach(city => {
      var option = document.createElement("option");
      option.text = city;
      x.add(option);
    });
}());

  document.getElementById("butAddCity").addEventListener("click", function() {
    // Add the newly selected city
    var select = document.getElementById("selectCityToAdd");
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    var label = selected.textContent;
    if (!app.selectedCities) {
      app.selectedCities = [];
    }
    app.getForecast(key, label);
    app.selectedCities.push({ key: key, label: label });
    app.saveSelectedCities();
    app.toggleAddDialog(false);
  });
  // document.getElementById('butAddCity').addEventListener('click', function() {
  //   // Add the newly selected city
  //   var select = document.getElementById('selectCityToAdd');
  //   var selected = select.options[select.selectedIndex];
  //   var key = selected.value;
  //   var label = selected.textContent;
  //   // TODO init the app.selectedCities array here
  //   app.getForecast(key, label);
  //   // TODO push the selected city to the array and save here
  //   app.toggleAddDialog(false);
  // });

  document.getElementById("butAddCancel").addEventListener("click", function() {
    // Close the add new city dialog
    app.toggleAddDialog(false);
  });

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function(visible) {
    if (visible) {
      app.addDialog.classList.add("dialog-container--visible");
    } else {
      app.addDialog.classList.remove("dialog-container--visible");
    }
  };

  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  app.updateForecastCard = function(data) {
    var dataLastUpdated = new Date(data.created);
    var sunrise = data.channel.astronomy.sunrise;
    var sunset = data.channel.astronomy.sunset;
    var current = data.channel.item.condition;
    var units = data.channel.units || {temperature:'C'};
    var humidity = data.channel.atmosphere.humidity;
    var visibility = data.channel.atmosphere.visibility || 0 ;
    var wind = data.channel.wind;
    var location = data.channel && data.channel.location && data.channel.location.city ? data.channel.location.city + ', ' + data.channel.location.region + ', ' + data.channel.location.country : data.label;

    var card = app.visibleCards[data.key];
    if (!card) {
      card = app.cardTemplate.cloneNode(true);
      card.classList.remove("cardTemplate");
      card.querySelector(".location").textContent = location;
      card.removeAttribute("hidden");
      app.container.appendChild(card);
      app.visibleCards[data.key] = card;
    }

    // Verifies the data provide is newer than what's already visible
    // on the card, if it's not bail, if it is, continue and update the
    // time saved in the card
    var cardLastUpdatedElem = card.querySelector(".card-last-updated");
    var cardLastUpdated = cardLastUpdatedElem.textContent;
    if (cardLastUpdated) {
      cardLastUpdated = new Date(cardLastUpdated);
      // Bail if the card has more recent data then the data
      if (dataLastUpdated.getTime() < cardLastUpdated.getTime()) {
        return;
      }
    }
    cardLastUpdatedElem.textContent = data.created;

    card.querySelector(".description").textContent = current.text;
    card.querySelector(".date").textContent = current.date;
    card
      .querySelector(".current .icon")
      .classList.add(app.getIconClass(current.code));
    card.querySelector(".current .temperature .value").textContent = Math.round(
      current.temp
    );
    card.querySelector(".current .temperature .scale").textContent = '°' + units.temperature || 'C';
    card.querySelector(".current .temperature .temp-high").textContent = data.channel.item.forecast[0].high;
    card.querySelector(".current .temperature .temp-low").textContent = data.channel.item.forecast[0].low;
    card.querySelector(".current .sunrise").textContent = sunrise;
    card.querySelector(".current .sunset").textContent = sunset;
    card.querySelector(".current .visibility").textContent = visibility + ' miles';
    card.querySelector(".current .humidity").textContent =
      Math.round(humidity) + "%";
    card.querySelector(".current .wind .value").textContent = Math.round(
      wind.speed
    );
    card.querySelector(".current .wind .direction").textContent =
      wind.direction;
    var nextDays = card.querySelectorAll(".future .oneday");
    var today = new Date();
    today = today.getDay();
    for (var i = 0; i < 7; i++) {
      var nextDay = nextDays[i];
      var daily = data.channel.item.forecast[i];
      if (daily && nextDay) {
        nextDay.querySelector(".date").textContent =
          app.daysOfWeek[(i + today) % 7];
        nextDay
          .querySelector(".icon")
          .classList.add(app.getIconClass(daily.code));
        nextDay.querySelector(".temp-high .value").textContent = Math.round(
          daily.high
        );
        nextDay.querySelector(".temp-low .value").textContent = Math.round(
          daily.low
        );
      }
    }
    if (app.isLoading) {
      app.spinner.setAttribute("hidden", true);
      app.container.removeAttribute("hidden");
      app.isLoading = false;
    }
  };

  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  /*
   * Gets a forecast for a specific city and updates the card with the data.
   * getForecast() first checks if the weather data is in the cache. If so,
   * then it gets that data and populates the card with the cached data.
   * Then, getForecast() goes to the network for fresh data. If the network
   * request goes through, then the card gets updated a second time with the
   * freshest data.
   */
  app.getForecast = function(key, label) {
    // var statement = "select * from weather.forecast where woeid=" + key;
    var statement = 'select%20*%20from%20weather.forecast%20where%20woeid%20in%20(select%20woeid%20from%20geo.places(1)%20where%20text%3D%22' + label + '%2C%20In%22)%20and%20u%3D%22c%22&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys';
    var url =
      "https://query.yahooapis.com/v1/public/yql?format=json&q=" + statement;
    // TODO add cache logic here
    if ("caches" in window) {
      /*
       * Check if the service worker has already cached this city's weather
       * data. If the service worker has the data, then display the cached
       * data while the app fetches the latest data.
       */
      caches.match(url).then(function(response) {
        if (response) {
          response.json().then(function updateFromCache(json) {
            var results = json.query.results;
            results.key = key;
            results.label = label;
            results.created = json.query.created;
            app.updateForecastCard(results);
          });
        }
      });
    }

    // Fetch the latest data.
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
      if (request.readyState === XMLHttpRequest.DONE) {
        if (request.status === 200) {
          var response = JSON.parse(request.response);
          var results = response.query.results;
          results.key = key;
          results.label = label;
          results.created = response.query.created;
          app.updateForecastCard(results);
        }
      } else {
        // Return the initial weather forecast since no data is available.
        app.updateForecastCard(initialWeatherForecast);
      }
    };
    request.open("GET", url);
    request.send();
  };

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateForecasts = function() {
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function(key) {
      app.getForecast(key);
    });
  };

  // TODO add saveSelectedCities function here
  // Save list of cities to localStorage.
  app.saveSelectedCities = function() {
    var selectedCities = JSON.stringify(app.selectedCities);
    localStorage.selectedCities = selectedCities;
  };

  app.getIconClass = function(weatherCode) {
    // Weather codes: https://developer.yahoo.com/weather/documentation.html#codes
    weatherCode = parseInt(weatherCode);
    switch (weatherCode) {
      case 25: // cold
      case 32: // sunny
      case 33: // fair (night)
      case 34: // fair (day)
      case 36: // hot
      case 3200: // not available
        return "clear-day";
      case 0: // tornado
      case 1: // tropical storm
      case 2: // hurricane
      case 6: // mixed rain and sleet
      case 8: // freezing drizzle
      case 9: // drizzle
      case 10: // freezing rain
      case 11: // showers
      case 12: // showers
      case 17: // hail
      case 35: // mixed rain and hail
      case 40: // scattered showers
        return "rain";
      case 3: // severe thunderstorms
      case 4: // thunderstorms
      case 37: // isolated thunderstorms
      case 38: // scattered thunderstorms
      case 39: // scattered thunderstorms (not a typo)
      case 45: // thundershowers
      case 47: // isolated thundershowers
        return "thunderstorms";
      case 5: // mixed rain and snow
      case 7: // mixed snow and sleet
      case 13: // snow flurries
      case 14: // light snow showers
      case 16: // snow
      case 18: // sleet
      case 41: // heavy snow
      case 42: // scattered snow showers
      case 43: // heavy snow
      case 46: // snow showers
        return "snow";
      case 15: // blowing snow
      case 19: // dust
      case 20: // foggy
      case 21: // haze
      case 22: // smoky
        return "fog";
      case 24: // windy
      case 23: // blustery
        return "windy";
      case 26: // cloudy
      case 27: // mostly cloudy (night)
      case 28: // mostly cloudy (day)
      case 31: // clear (night)
        return "cloudy";
      case 29: // partly cloudy (night)
      case 30: // partly cloudy (day)
      case 44: // partly cloudy
        return "partly-cloudy-day";
    }
  };

  /*
   * Fake weather data that is presented when the user first uses the app,
   * or when the user has not saved any cities. See startup code for more
   * discussion.
   */
  /*
*/
 var initialWeatherForecast =
{
      "channel": {
        "units": {
          "distance": "km",
          "pressure": "mb",
          "speed": "km/h",
          "temperature": "C"
        },
        "title": "Yahoo! Weather - Agra, UP, IN",
        "link": "http://us.rd.yahoo.com/dailynews/rss/weather/Country__Country/*https://weather.yahoo.com/country/state/city-2295399/",
        "description": "Yahoo! Weather for Agra, UP, IN",
        "language": "en-us",
        "lastBuildDate": "Fri, 05 Oct 2018 01:41 PM IST",
        "ttl": "60",
        "location": {
          "city": "Agra",
          "country": "India",
          "region": " UP"
        },
        "wind": {
          "chill": "91",
          "direction": "293",
          "speed": "6.44"
        },
        "atmosphere": {
          "humidity": "45",
          "pressure": "33626.85",
          "rising": "0",
          "visibility": "25.91"
        },
        "astronomy": {
          "sunrise": "6:13 am",
          "sunset": "6:0 pm"
        },
        "image": {
          "title": "Yahoo! Weather",
          "width": "142",
          "height": "18",
          "link": "http://weather.yahoo.com",
          "url": "http://l.yimg.com/a/i/brand/purplelogo//uh/us/news-wea.gif"
        },
        "item": {
          "title": "Conditions for Agra, UP, IN at 12:30 PM IST",
          "lat": "27.1838",
          "long": "77.994453",
          "link": "http://us.rd.yahoo.com/dailynews/rss/weather/Country__Country/*https://weather.yahoo.com/country/state/city-2295399/",
          "pubDate": "Fri, 05 Oct 2018 12:30 PM IST",
          "condition": {
            "code": "32",
            "date": "Fri, 05 Oct 2018 12:30 PM IST",
            "temp": "32",
            "text": "Sunny"
          },
          "forecast": [
            {
              "code": "32",
              "date": "05 Oct 2018",
              "day": "Fri",
              "high": "33",
              "low": "21",
              "text": "Sunny"
            },
            {
              "code": "32",
              "date": "06 Oct 2018",
              "day": "Sat",
              "high": "33",
              "low": "21",
              "text": "Sunny"
            },
            {
              "code": "32",
              "date": "07 Oct 2018",
              "day": "Sun",
              "high": "33",
              "low": "20",
              "text": "Sunny"
            },
            {
              "code": "32",
              "date": "08 Oct 2018",
              "day": "Mon",
              "high": "33",
              "low": "21",
              "text": "Sunny"
            },
            {
              "code": "32",
              "date": "09 Oct 2018",
              "day": "Tue",
              "high": "33",
              "low": "19",
              "text": "Sunny"
            },
            {
              "code": "30",
              "date": "10 Oct 2018",
              "day": "Wed",
              "high": "33",
              "low": "22",
              "text": "Partly Cloudy"
            },
            {
              "code": "30",
              "date": "11 Oct 2018",
              "day": "Thu",
              "high": "31",
              "low": "20",
              "text": "Partly Cloudy"
            },
            {
              "code": "30",
              "date": "12 Oct 2018",
              "day": "Fri",
              "high": "31",
              "low": "22",
              "text": "Partly Cloudy"
            },
            {
              "code": "34",
              "date": "13 Oct 2018",
              "day": "Sat",
              "high": "31",
              "low": "21",
              "text": "Mostly Sunny"
            },
            {
              "code": "34",
              "date": "14 Oct 2018",
              "day": "Sun",
              "high": "30",
              "low": "19",
              "text": "Mostly Sunny"
            }
          ],
          "description": "<![CDATA[<img src=\"http://l.yimg.com/a/i/us/we/52/32.gif\"/>\n<BR />\n<b>Current Conditions:</b>\n<BR />Sunny\n<BR />\n<BR />\n<b>Forecast:</b>\n<BR /> Fri - Sunny. High: 33Low: 21\n<BR /> Sat - Sunny. High: 33Low: 21\n<BR /> Sun - Sunny. High: 33Low: 20\n<BR /> Mon - Sunny. High: 33Low: 21\n<BR /> Tue - Sunny. High: 33Low: 19\n<BR />\n<BR />\n<a href=\"http://us.rd.yahoo.com/dailynews/rss/weather/Country__Country/*https://weather.yahoo.com/country/state/city-2295399/\">Full Forecast at Yahoo! Weather</a>\n<BR />\n<BR />\n<BR />\n]]>",
          "guid": {
            "isPermaLink": "false"
          }
        }
      }
};
  // TODO uncomment line below to test app with fake data
  //app.updateForecastCard(initialWeatherForecast);
  //hbjsahdbsahjd
  // dsfkjshfhsdk222222
  // 3333333
  // TODO add startup code here
  /************************************************************************
   *
   * Code required to start the app
   *
   * NOTE: To simplify this codelab, we've used localStorage.
   *   localStorage is a synchronous API and has serious performance
   *   implications. It should not be used in production applications!
   *   Instead, check out IDB (https://www.npmjs.com/package/idb) or
   *   SimpleDB (https://gist.github.com/inexorabletash/c8069c042b734519680c)
   ************************************************************************/

  app.selectedCities = localStorage.selectedCities;
  if (app.selectedCities) {
    app.selectedCities = JSON.parse(app.selectedCities);
    app.selectedCities.forEach(function(city) {
      app.getForecast(city.key, city.label);
    });
  } else {
    /* The user is using the app for the first time, or the user has not
       * saved any cities, so show the user some fake data. A real app in this
       * scenario could guess the user's location via IP lookup and then inject
       * that data into the page.
       */
    app.updateForecastCard(initialWeatherForecast);
    app.selectedCities = [
      { key: initialWeatherForecast.key, label: initialWeatherForecast.label }
    ];
    app.saveSelectedCities();
  }
  // TODO add service worker code here
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").then(function() {
      console.log("Service Worker Registered");
    });
  }
})();
