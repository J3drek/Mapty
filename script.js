'use strict';




const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const logo = document.querySelector('.logo');
const workoutField = document.querySelector('.workout');

class Workout{
    date = new Date();
    id = ((Date.now() + '').slice(-10));
    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance; //KM
        this.duration = duration; //minutes
        
    }
    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }
    
};

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace(){
        this.pace = this.duration / this.distance;
        return this.pace;
    }
};

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this._setDescription();
        this.calcSpeed();
    }
    calcSpeed(){
        this.speed = this.distance/ (this.duration / 60);
        return this.speed;
    }
};




//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
//APPLICATION ARCHITECTURE
class App{
    //Private fields
    #map;
    #mapEvent;
    #workouts = [];

    constructor(){
        //Immediatly invoked(after page loaded-look on the bottom)
        //Get user's position
        this._getPosition();
        //event listeners
        form.addEventListener('submit', this._newWorkout.bind(this));
        logo.addEventListener('click', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPin.bind(this));
        //getting local storage
        this._getLocalStorage();
        
        
    }

    _getPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),
            function(){
                alert('Coud not get your location');
            }); 
        };
    }


    _loadMap(position){//function argument is recived from navigator.geolocation.getCurrentPosition(exactly GeolocationPosition so it doesn't need to be manually entered)
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        const coords = [latitude,longitude];
        
        this.#map = L.map('map').setView(coords, 14);
    
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        
        this.#map.on('click', this._showForm.bind(this));
        this.#workouts.forEach(item => {
            this._renderWorkoutMarker(item);
        });
        
    }

    _clearInput(){
        document.querySelectorAll('.form__input').forEach(item => {
            if(!item.classList.contains('form__input--type')) item.value = ''
            }
        );
    }


    _showForm(e){
        this.#mapEvent = e;
        form.classList.remove('hidden');
        inputDistance.focus();
        console.log();
    }

    _hideForm(){
        this._clearInput();
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid',1000);

    }


    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }


    _newWorkout(event){
        //validating inputs, if they are numbers
        const validInputs = (...inputs) => inputs.every(input => Number.isFinite(input));
        //checking if inputed numbers are positive
        const allPositive = (...inputs) => inputs.every(input => input > 0);

        event.preventDefault();
        //local variables
        const type = inputType.value; 
        const distance = Number(inputDistance.value);
        const duration = Number(inputDuration.value);
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;
        


        if(type === 'running'){
            const cadence = Number(inputCadence.value);
            if(!validInputs(distance, duration, cadence) || !allPositive(distance, cadence, duration)){
                this._clearInput();
                return alert('This value is not a positive number!');
            } 
            workout = new Running([lat,lng], distance, duration, cadence);
            
        }


        if(type === 'cycling'){
            const elevGain = Number(inputElevation.value);
            if(!validInputs(distance, duration, elevGain) || !allPositive(distance, duration)){
                this._clearInput();
                return alert('This value is not a positive number!');
            } 
            workout = new Cycling([lat,lng], distance, duration, elevGain);
            
        }
        // console.log(workout);
        this.#workouts.push(workout);
        this._renderWorkoutMarker(workout);
        this._renderWorkout(workout);
        this._hideForm();
        this._setLocalStorage();
    }


    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map).bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`,
            
        })).setPopupContent(`${workout.description} ${workout.type === 'running'? ' 🏃‍♂️' : '🚴‍♀️'}`).openPopup();
    }

    _renderWorkout(workout){
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running'? ' 🏃‍♂️' : '🚴‍♀️'} </span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

        if(workout.type === 'running')
            html += `<div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace.toFixed(1)}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence.toFixed(1)}</span>
                    <span class="workout__unit">spm</span>
                </div>
                </li>`;

        if(workout.type === 'cycling')
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;

        form.insertAdjacentHTML('afterend',html);
    }


    _moveToPin(event){
        const workoutEl = event.target.closest('.workout');
        if(!workoutEl) return;
        const currentWorkout = this.#workouts.filter(item => item.id == workoutEl.dataset.id);
        this.#map.setView(currentWorkout[0].coords, 14, {
            "animate": true,
            "pan": {
              "duration": 0.45
            }
        })
    }

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _getLocalStorage(){
        const data =JSON.parse(localStorage.getItem('workouts'));

        if(!data) return;//guard clause
        this.#workouts = data;
        this.#workouts.forEach(item => {
            this._renderWorkout(item);
        });
    }
    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
    


};

const app = new App();





