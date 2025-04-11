// Chaz Knapp - CSCV 337 - 4/13/2025 -  Assignment 5 - Baby Names

// This JS file loads baby name data, displays a ranking graph, shows the meaning of the name sourced from the data using a modern fetch API.

// This code does a good job mimicking the image in the Assignment 5 pdf. However, the years don't match up as in the 
// example the names wear categorized in decades as opposed to years. In this dataset we are using ten years worth of 
// data from 2014 - 2023. 


// Must wait for the full DOM content to load before running the script ensures the elements referenced exist before we attempt to access.
document.addEventListener("DOMContentLoaded", function () {

    // This is meant to reference the elements found in HTML that will be used throughout this script.
    const selectElement = document.getElementById("babyselect");
    const graphDiv = document.getElementById("graph");
    const meaningParagraph = document.getElementById("meaning");
    const errorDiv = document.getElementById("errors");

    // -- Retrieving all baby names from the dataset. --

    // This function fetches all name entries from the SheetBest API, extracts the name field, removes duplicates, sorts them,
    // and passes them to the dropdown menu for user selection.
    // Utilized AJAX, as mentioned in the assignment pdf, through the more modern Fetch API for the AJAX requests.
    // This is functionally equivalent to Ajax.Request from Prototype.js, but I've read cleaner and more readable.
    // It asynchronously fetches JSON data from the SheetBest API without reloading the page, which was a quiz question!

function fetchNames() {
    // Start by making a GET request to the SheetBest API endpoint.
    // This fetches the full dataset making each row a new object.
    fetch("https://api.sheetbest.com/sheets/c1e0ead6-6df0-49f7-ace0-ec90562a8c3f")
        .then(function (response) {
            // Converts the raw response into JSON so we can work with it.
            // The result will be an array of objects, each with name, year, rank, etc.
            return response.json();
        })
        .then(function (data) {
            // Now that we have all the data, extract just the names.
            // I'm using .map here to transform each object into just the `name` field.
            // This gives me a flat list like: ["Emma", "Liam", "Noah", etc]
            const namesOnly = data.map(function (item) {
                return item.name;
            });

            // There may be many duplicate names in the list since the dataset
            // includes multiple years per name — so I use a Set to filter out duplicates.
            // Using the spread operator (`...`) converts the Set back into a plain array.
            // I then sort the list alphabetically so users can find names easily in the dropdown.
            const uniqueNames = [...new Set(namesOnly)].sort();

            // Now I hand off the cleaned list of names to another function that
            // will handle rendering the dropdown options.
            populateDropdown(uniqueNames);
        })
        .catch(function (error) {
            // If something goes wrong with the fetch (like no internet or bad URL),
            // call the error handler so we can log it or show a message to the user.
            handleError(error);
        });
}


    // This function receives an array of unique, sorted names.
    // It dynamically populates the dropdown menu so the user can pick a name to explore.
    function populateDropdown(names) {
        selectElement.innerHTML = '<option value="">Select a name...</option>'; // Default prompt

        names.forEach(function (name) {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            selectElement.appendChild(option);
        });

        // Enable dropdown after population
        selectElement.disabled = false;
    }

    // -- Fetch rank + meaning for a selected name. --

    // When a user picks a name, this function grabs all entries for that name (across years),
    // and then hands the data to the graph and meaning display functions.
    // We're using a filtered URL like `/name/${name}` to get all rows that match the selected name.
    // Even though the URL only filters by `name`, the response includes *every column* for that name.
    // This avoids the need to fetch `rank`, `meaning`, and other fields individually. The instructions stated
    // to make the code and clean as poossible so I used decided figuring this out would be beneficial and revelant.
    // It's a clean and efficient approach because we're grabbing the full row of data in one request.
   
    //
    // This is why you’ll see `data` passed into both `displayGraph()` and `displayMeaning()`
    // — they’re just pulling different parts of the same full record(s).
    function fetchNameDetails(name) {
        fetch(`https://api.sheetbest.com/sheets/c1e0ead6-6df0-49f7-ace0-ec90562a8c3f/name/${name}`)
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                displayGraph(data);  
                displayMeaning(data); 
            })
            .catch(function (error) {
                handleError(error);
            });
    }

    // -- Visualize baby name ranks across 10 years. --

    // This function takes a list of baby name rankings (for a single name across years)
    // and dynamically generates a bar graph that shows the name's popularity over time.
    // The graph is drawn in a div called 'graphDiv', with each bar representing a year.

    function displayGraph(rankings) {
        // Clear out any previous graph elements from the graph container
        graphDiv.innerHTML = "";
    
        // These are the full 10 years we want to display on the x-axis.
        // Even if the name wasn't ranked in a year, we still want to leave a bar placeholder for visual consistency.
        // The original version I created couldn't pull the year, so I made sure to just secure them with this code
        // as I think the years being shown make the graph more meaningful.
        const allYears = ["2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023"];
    
        // Build a dictionary that maps each year to its rank for the selected name.
        const yearToRank = {};
        rankings.forEach(function (item) {
            yearToRank[item.year] = parseInt(item.rank);
        });
    
        // Extract only the rank values 
        const rankValues = rankings
            .map(item => parseInt(item.rank))
            .filter(rank => rank > 0);
    
        // If all years were unranked, don't try to draw a graph
        if (rankValues.length === 0) {
            graphDiv.textContent = "This name has no ranking data.";
            return;
        }
    
        // Find the min and max ranks in this list (for normalization).
        // This helps us scale the bar height relative to actual variation in data, which I had many problems with.
        // most popular (lowest number)
        const minRank = Math.min(...rankValues);
        // least popular (highest number)
        const maxRank = Math.max(...rankValues); 
    
        // We’ll use these to map rank values to relative bar heights (0 to 100% range).
        // Lower ranks = taller bars (since rank 1 is more popular than 1000).
        // Used: Normalized height = (maxRank - rank) / (maxRank - minRank)
        allYears.forEach(function (year, index) {
            // Get the rank for this year, or 0 if it doesn't exist as that woule mean it is not ranked.
            const rankValue = yearToRank[year] || 0;
    
            let barHeight;
    
            if (rankValue === 0) {
                // Counts the 0ndata and represents it as a ground level bar at 0
                barHeight = 0;
            } else if (minRank === maxRank) {
                // If all ranks are the same, just give them a flat visual height
                barHeight = 80;
            } else {
                // Normalize the rank so that taller bars represent more popular years as shown in assignment.
                const normalized = (maxRank - rankValue) / (maxRank - minRank);
                barHeight = Math.floor(normalized * 180); // Scale to max 180px tall
            }
    
            // Set horizontal bar position based on index (spaced out across graph)
            const xPos = 10 + index * 60;
    
            // Create the actual bar <div> and style it
            // Create the bar
            const bar = document.createElement("div");
            bar.classList.add("ranking");
            bar.style.height = barHeight + "px";
            bar.style.left = xPos + "px";

            // Only show the text if the height is greater than 0
            if (barHeight > 0) {
                bar.textContent = rankValue;
            }

    
            // Add a special color for names ranked in top 10
            if (rankValue > 0 && rankValue <= 10) {
                bar.classList.add("popular");
            }
    
            // Adds bars to graph
            graphDiv.appendChild(bar);
    
            // Add a label
            const label = document.createElement("p");
            label.classList.add("year");
            label.style.left = xPos + "px";
            label.textContent = year;
    
            graphDiv.appendChild(label);
        });
    }
    

    // -- Display the meaning of the selected baby name --

    // This function takes the full dataset 
    // and extracts the 'meaning' field from the first entry
    // I display the meaning below the graph in a <p> element called meaningParagraph.
    function displayMeaning(data) {
        if (data.length > 0 && data[0].meaning) {
            meaningParagraph.textContent = "Origin/Meaning: " + data[0].meaning;
        } else {
            meaningParagraph.textContent = "Origin/Meaning: (Nothing for you here! Whoops!)";
        }
    }


    // General error message if anything goes wrong.
    function handleError(error) {
        errorDiv.textContent = "ATTENTION!! SOMETHING WENT WRONG: " + error.message;
    }

    // Detect dropdown change to load rank + meaning.
    // This fires when the user picks a name from the dropdown.
    // It checks the selected value and either loads data or resets the display.
    selectElement.addEventListener("change", function () {
        const selectedName = selectElement.value;

        if (selectedName) {
            fetchNameDetails(selectedName);
        } else {
            // Clear output if user reverts selection
            graphDiv.innerHTML = "";
            meaningParagraph.textContent = "";
            errorDiv.textContent = "";
        }
    });

    // Load initial name list on page load
    fetchNames();
});
