import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

import { CartStatesEnum } from './cart-states.enum';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MercadoPagoService } from './mercado-pago.service';
import { CartService } from './cart.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
	//Models
	loading: boolean;
	cartState: CartStatesEnum;
	cartStates: any = CartStatesEnum; //Load enum to use it in HTML
	cards: any[]; //TODO: Create model for card
	identificationTypes: any[];  //TODO: Create model for identification types
	cardForm: FormGroup;
	cardPaymentMethod: string;
	
	//JUST FOR TEST
	accessToken: any;

	//Inject services
	constructor(
		private httpClient: HttpClient,
		private formBuilder: FormBuilder,
		private cartService: CartService,
		private mercadoPagoService: MercadoPagoService){}
	
	//On component init
	ngOnInit(){
		//JUST FOR TEST
		this.loadSession();

		//Init vars
		this.cards = [];
		this.cardPaymentMethod = '';
		this.cardForm = this.formBuilder.group({
			"email": this.formBuilder.control('test_user_19653727@testuser.com', [ Validators.required ]),
			"cardNumber": this.formBuilder.control('4157 2362 1173 6486', [ Validators.required ]),
			"securityCode": this.formBuilder.control('123', [ Validators.required ]),
			"cardExpirationMonth": this.formBuilder.control('12', [ Validators.required ]),
			"cardExpirationYear": this.formBuilder.control('2019', [ Validators.required ]),
			"cardholderName": this.formBuilder.control('APRO', [ Validators.required ]),
			"docType": this.formBuilder.control('', [ Validators.required ]),
			"docNumber": this.formBuilder.control('12345678', [ Validators.required ]),
		});

		//Init cart state
		if(this.accessToken){
			this.cartState = CartStatesEnum.LOGGED;
		} else {
			this.cartState = CartStatesEnum.NOT_LOGGED;
		}

		//Init MP
		this.initMP();
	}

	//Custom events
	onLogin(){
		this.login();
	}

	onAddCard(){
		//Check is valid
		if(this.cardForm.valid && this.cardPaymentMethod){
			//Set loading on
			this.loading = true;

			//Create MP card token
			this.mercadoPagoService.createCardToken(this.cardForm.value).subscribe(
				(response: any) => {

					//Create columnis card object
					this.cartService.createCard(response.id, this.cardPaymentMethod).subscribe(
						(cardResponse: any) => {

						},
						(error: any) => {
							//Stop loading
							this.loading = false;
						}
					);
				},
				(error: any) => {
					//Stop loading
					this.loading = false;
				}
			);
		} else {
			//TODO: Trigger form validations with FormUtility
		}
	}

	onCardNumberChange(){
		//calculate bin
		const bin: string = this.mercadoPagoService.getBin(this.cardForm.value.cardNumber);

		//Check bin
		if(bin){
			//Find payment method
			this.mercadoPagoService.getPaymentMethod(bin).subscribe(
				(response: any) => {
					//Load payment method
					this.cardPaymentMethod = response.id;
				}
			)
		}
	}

	//Private methods
	private initMP(){
		//Init SDK
		this.mercadoPagoService.initSDK();
		
		//Load MP identification methods
		this.mercadoPagoService.fetchIdentificationTypes().subscribe((identificationTypes: any[]) => {
			this.identificationTypes = identificationTypes;

			//Suggest form, first type
			if(identificationTypes && identificationTypes.length){
				this.cardForm.patchValue({
					"docType": identificationTypes[0].id
				});
			}
		});

		//Inital trigger for testing
		//The card number test value is valid
		this.onCardNumberChange();
	}

	//JUST FOR TEST METHODS
	private login(){
		//Start loading
		this.loading = true;

		//Request token
		this.httpClient.post(environment.apiURL + "/oauth", {
			"username": "gustavo.rodriguez@solcre.com",
			"password": "hola123",
			"grant_type": "password",
			"client_id": "web"
		}).subscribe(
			(token: any) => {
				this.accessToken = token;
				localStorage.setItem('mp_access_token', JSON.stringify(token));
				this.cartState = CartStatesEnum.LOGGED;
				this.loading = false;
			},
			(error: any) => {
				this.loading = false;
			}
		);
	}

	private loadSession(){
		let token: string = localStorage.getItem('mp_access_token');

		//Check token
		if(token){
			this.accessToken = JSON.parse(token);
		}
	}
}
