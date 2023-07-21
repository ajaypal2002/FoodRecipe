var APIKey = 'be1a3b16ffa44575b01cb470f3ce3e58';
var dishName = document.querySelector('#food');
var cuisineName = document.querySelector('#cuisine');
var submitButtonEl = $('#submit')
var dishesContainer = $('#showIngredients');
var ingredientsContainer = $('#ingredientsAndPrices');
var selectedDish = $('#selectedDishName');
var ingredientButton = $('#ingredientButton');
var ingredientName = document.querySelector('#ingredient');
var ingredientCost = document.querySelector('#ingredientCost');
var sumContainer = $('#sumContainer');
var macroContainer = $('#macroContainer');
var buttons = $('#ingredientHistory');
var avoidButton = $('#avoidButton');

selectedDish.hide();

//takes dish and cuisine input
var formSubmitHandler = function (event) {
    event.preventDefault();

    var dishNameEl = dishName.value.trim();
    var cuisineNameEl = cuisineName.value.trim();

    if (dishNameEl) {
        getDishInfo(dishNameEl, cuisineNameEl)
    } 
    else {
        alert("Please enter a dish and cuisine");
    }
};

submitButtonEl.on('click', formSubmitHandler);

//takes ingredient to check macros
var clickHandler = function (event) {
    event.preventDefault();

    var ingredientNameEl = ingredientName.value.trim();

    if (ingredientNameEl) {
        getIngredientInfo(ingredientNameEl);
    } 
    else {
        alert("Please enter an ingredient");
    }

};

ingredientButton.on('click', clickHandler);

//API call to get dish names
function getDishInfo(dish, cuisine) {
    var apiUrl = 'https://api.spoonacular.com/recipes/complexSearch?query=' + dish + '&cuisine=' + cuisine + '&apiKey=' + APIKey + '&number=12'

    fetch(apiUrl)
    .then(function (response) {
        if (response.ok) {
            response.json().then(function (data) {
                for (var i = 0; i < data.results.length; i++) {
                    displayDishName(data.results[i]);
                }
            })
        }
    })
};

//function to make buttons to display dishes
var displayDishName = function (dish) {
    ingredientsContainer.empty();
    selectedDish.hide();
    var buttonContent = dish.title;
    var button = $('<button>');
    button.text(buttonContent);
    button.attr('id', dish.id);
    button.addClass("text-white font-bold bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900 object-scale-down border-2 border-white");
    button.on('click', clickDish);
    dishesContainer.append(button);
};

function clickDish(event) {
    event.preventDefault();
    var buttonClicked = event.target;
    displayIngredients(buttonClicked.id);
    dishesContainer.empty();
    selectedDish.show();
};

//API call to get list of ingredients 
var retrieveData = async function (id) {
    var recipeUrl = 'https://api.spoonacular.com/recipes/' + id + '/information?apiKey=' + APIKey;
    const response = await fetch(recipeUrl);
    const recipeData = await response.json();
    var ingredientCosts = [];
    for (var i = 0; i < recipeData.extendedIngredients.length; i++) {
        ingredientCosts[i] = await getIngredientAmount(recipeData.extendedIngredients[i].id, recipeData.extendedIngredients[i].amount,
            recipeData.extendedIngredients[i].unit);
    }

    return {
        ingredients: recipeData.extendedIngredients,
        ingredientCosts: ingredientCosts
    }
};

//API call to get ingredient's prices through ID of ingredient
var getIngredientAmount = async function (ingredientId, amount, unit) {
    var apiUrl = 'https://api.spoonacular.com/food/ingredients/' + ingredientId + '/information?apiKey=' + APIKey + '&amount=' + amount + '&unit=' + unit;
    const response = await fetch(apiUrl);
    if (response.ok) {
        const ingredientData = await response.json();
        return ingredientData.estimatedCost.value;
    } 
    else {
        return 0;
    }
};

var sum = 0;
var displayIngredients = async function (id) {

    sum = 0;
    ingredientsContainer.empty();
    var key = "ingredientName";
    var stored = localStorage.getItem(key);
    var avoidItems;
    if (stored === null) {
        avoidItems = []
    } 
    else {
        avoidItems = JSON.parse(stored);
    }

    var data = await retrieveData(id);
    for (var i = 0; i < data.ingredients.length; i++) {

        var row = $('<div>');
        row.addClass("flex justify-center");
        var listItemContent = data.ingredients[i].name;
        var priceContent = data.ingredientCosts[i];
        var listItem = $('<li>');
        listItem.text(listItemContent + ' ¢ ' + priceContent);

        if (avoidItems.length === 0) {
            listItem.addClass("bg-red-700 hover:bg-[#222831] text-white font-semibold py-2 px-4 border-2 border-white rounded shadow w-2/3");
        } 
        else {
            //color orange if item is from avoid items array in local storage, else color red
            for (var j = 0; j < avoidItems.length; j++) {
                if (avoidItems[j].includes(listItemContent) || listItemContent.includes(avoidItems[j])) {
                    listItem.addClass("bg-orange-300 hover:bg-[#222831] text-white font-semibold py-2 px-4 border-2 border-white rounded shadow w-2/3");
                } 
                else {
                    listItem.addClass("bg-red-700 hover:bg-[#222831] text-white font-semibold py-2 px-4 border-2 border-white rounded shadow w-2/3");
                }
            }
        }

        sum += priceContent;

        var haveButton = $('<button>');
        haveButton.addClass("have-btn bg-red-700 hover:bg-[#222831] text-white font-semibold py-2 px-4 border-2 border-white rounded shadow");
        haveButton.text("I have this");
        row.append(listItem, haveButton);
        haveButton.one('click', updateSum); //This makes the updating the total cost button click once. 
        haveButton.attr('id', priceContent);
        ingredientsContainer.append(row);
    }
    console.log(sum);
    displaySum(sum);

};

//displays total cost of ingredients
var displaySum = function (sum) {
    sumContainer.empty();
    var sumText = $('<h2>');
    sumText.text('$ ' + Math.round(sum / 100));
    sumContainer.append(sumText);
};

//function to subtract price of ingredient user already has
var updateSum = function (event) {
    event.preventDefault();
    var buttonClicked = event.target;
    $(buttonClicked).parent().children('li').removeClass("bg-red-700");
    $(buttonClicked).parent().children('li').addClass("bg-slate-400");
    $(buttonClicked).parent().children('button').removeClass("bg-red-700");
    $(buttonClicked).parent().children('button').addClass("bg-slate-400");
    var subtractAmount = parseInt(buttonClicked.id);
    sum = sum - subtractAmount;
    displaySum(sum);
};

//API call to get macro nutrients
var getIngredientInfo = function (ingredient) {
    macroContainer.empty();

    var apiUrl = 'https://api.edamam.com/api/food-database/v2/parser?app_id=0c089911&app_key=dfc46540c3734d0319db196d84047446&ingr=' + ingredient + '&nutrition-type=cooking';
    fetch(apiUrl)
    .then(function (response) {
        if (response.ok) {
            response.json().then(function (data) {
                console.log(data.parsed[0].food.nutrients);
                console.log(data.parsed[0]);

                var nutrientKeys = Object.keys(data.parsed[0].food.nutrients);
                for (var i = 0; i < nutrientKeys.length; i++) {
                    var nutrient1 = nutrientKeys[0];
                    var nutrient2 = nutrientKeys[1];
                    var nutrient3 = nutrientKeys[2];
                    var nutrient4 = nutrientKeys[3];
                    var nutrient5 = nutrientKeys[4];

                    var listItem1 = $('<li>');
                    listItem1.text("Calories- " + data.parsed[0].food.nutrients[nutrient1]);
                    listItem1.addClass("text-xl font-bold list-none");
                    var listItem2 = $('<li>');
                    listItem2.text("Protein- " + data.parsed[0].food.nutrients[nutrient2]);
                    listItem2.addClass("text-xl font-bold list-none");
                    var listItem3 = $('<li>');
                    listItem3.text("Fat- " + data.parsed[0].food.nutrients[nutrient3]);
                    listItem3.addClass("text-xl font-bold list-none");
                    var listItem4 = $('<li>');
                    listItem4.text("Carbohydrate- " + data.parsed[0].food.nutrients[nutrient4]);
                    listItem4.addClass("text-xl font-bold list-none");
                    var listItem5 = $('<li>');
                    listItem5.text("Fiber- " + data.parsed[0].food.nutrients[nutrient5]);
                    listItem5.addClass("text-xl font-bold list-none");

                }
                macroContainer.append(listItem1, listItem2, listItem3, listItem4, listItem5);
            });
        }
    })
};

//saving ingredients that user wants to avoid to local storage
function saveIngredient(ingredient) {
    var key = "ingredientName";
    var valueToSave = ingredient;
    var history = localStorage.getItem(key);

    if (history === null) {
        localStorage.setItem(key, JSON.stringify("[]"));
        history = "[]";
    }
    var currentHistory = JSON.parse(history);
    if (!currentHistory.includes(valueToSave)) {
        currentHistory.push(valueToSave);
        localStorage.setItem(key, JSON.stringify(currentHistory));
    }
};


function avoidIngredient(event) {
    event.preventDefault();

    var ingredientNameEl = ingredientName.value.trim();
    saveIngredient(ingredientNameEl);
};

avoidButton.on('click', avoidIngredient)
