# LocalSpot
A local place discovery web application created by Thy Thao Le Huynh

Users can search for restaurants, cafés, activities and parks near a selected location.

# Live Demo
https://tlehuynh.github.io/LocalSpot/

# Features
- Search for places by location
- Browse restaurants, cafés, activities, and parks
- Filter results using keywords
- View real place data using the Geoapify API
- Open addresses directly in Google Maps
- Visit official business websites when available
- View business photos when available
- Save and remove favorite places
- Favorites persist using localStorage
- Responsive design for desktop and mobile

# Technologies
- HTML
- CSS
- JavaScript
- Geoapify API
- Google Maps links
- localStorage

# How It Works
LocalSpot uses the Geoapify Geocoding API to convert a searched location into latitude and longitude coordinates.

These coordinates are used to search for places in the vicinity using the Geoapify Places API. The search results are filtered on the client-side using JavaScript. The results are displayed as card for each place on the page.

# Author
Built by Thy Thao Le Huynh
