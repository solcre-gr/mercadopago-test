import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
export class AppComponent implements OnInit {
	//Models
	loading: boolean;
	cartState: CartStatesEnum;
	cartStates: any = CartStatesEnum; //Load enum to use it in HTML
	cards: any[]; //TODO: Create model for card
	identificationTypes: any[];  //TODO: Create model for identification types
	paymentMethods: any[]; //TODO: Create model for payment methods
	installments: any[];
	cardForm: FormGroup;
	payForm: FormGroup;
	cardPaymentMethod: string;
	cardPaymentMethodType: string  = 'card';

	//JUST FOR TEST
	accessToken: any;

	//Inject services
	constructor(
		private httpClient: HttpClient,
		private formBuilder: FormBuilder,
		private cartService: CartService,
		private mercadoPagoService: MercadoPagoService) { }

	//On component init
	ngOnInit() {
		//JUST FOR TEST
		this.loadSession();

		//Init vars
		this.cards = [];
		this.cardPaymentMethod = '';
		this.cardForm = this.formBuilder.group({
			"email": this.formBuilder.control('test_user_19653727@testuser.com', [Validators.required]),
			"cardNumber": this.formBuilder.control('4157 2362 1173 6486', [Validators.required]),
			"securityCode": this.formBuilder.control('123', [Validators.required]),
			"cardExpirationMonth": this.formBuilder.control('12', [Validators.required]),
			"cardExpirationYear": this.formBuilder.control('2019', [Validators.required]),
			"cardholderName": this.formBuilder.control('APRO', [Validators.required]),
			"docType": this.formBuilder.control('', [Validators.required]),
			"docNumber": this.formBuilder.control('12345678', [Validators.required]),
		});
		this.payForm = this.formBuilder.group({
			"card": this.formBuilder.control('', [ Validators.required ]),
			"paymentMethodType": this.formBuilder.control('', [ Validators.required ]),
			"installments": this.formBuilder.control('1', [ Validators.required ]),
			"issuer": this.formBuilder.control('', [ Validators.required ]),
			"cvv": this.formBuilder.control('', [ Validators.required ])
		});

		//Init cart state
		if (this.accessToken) {
			this.cartState = CartStatesEnum.LOGGED;
		} else {
			this.cartState = CartStatesEnum.NOT_LOGGED;
		}

		//Init MP
		this.initMP();

		//Fetch cards
		if(this.accessToken){
			this.fetchUserCards();
		}
	}

	//Custom events
	onAddCard() {
		//Check is valid
		if (this.cardForm.valid && this.cardPaymentMethod) {
			//Set loading on
			this.loading = true;

			//Create MP card token
			this.mercadoPagoService.createCardToken(this.cardForm.value).subscribe(
				(response: any) => {

					//Create columnis card object
					this.cartService.createCard(response.id, this.cardPaymentMethod).subscribe(
						(card: any) => {
							//TODO: Change type to CardModel when it is created
							//Push to cards array
							this.cards.push(card);

							//Stop loading
							this.loading = false;
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

	onCardNumberChange() {
		//calculate bin
		const bin: string = this.mercadoPagoService.getBin(this.cardForm.value.cardNumber);

		//Check bin
		if (bin) {
			//Find payment method
			this.mercadoPagoService.getPaymentMethod(bin).subscribe(
				(response: any) => {
					//Load payment method
					this.cardPaymentMethod = response.id;
				}
			)
		}
	}

	onPay(){
		this.createOrderAndPay();
	}

	onChangePaymentMethod(){
		//Empty values
		let values: any  = {
			"card": "",
			"installments": "",
			"issuer": "",
			"cvv": ""
		};

		//Is other than card?
		if(this.payForm.value.paymentMethodType != this.cardPaymentMethodType){
			//Clear card & installments
			values = {
				"card": "-",
				"installments": "-",
				"issuer": "-",
				"cvv": "-"
			};
		}

		//Patch
		this.payForm.patchValue(values);
	}

	onChangeCardSelected(){
		let card: any = this.getSelectedCard();

		//TODO: REMOVE THIS AND LOAD FROM ORDER
		let orderTotal: number = 10000;

		//Clear installments
		this.installments = [];

		//Clear issuer id from form
		this.payForm.patchValue({
			"installments": "",
			"issuer": ""
		});

		//Check card found
		if(card){
			//Fetch installments
			this.mercadoPagoService.getInstallments(card.firstSixDigits, orderTotal).subscribe(
				(installmentsResponse: any) => {
					//Load installments
					this.installments = installmentsResponse.payer_costs;

					//Suggest installemt
					if(this.installments && this.installments.length){
						this.payForm.patchValue({
							"installments": this.installments[this.installments.length - 1].installments
						});
					}

					//Load issuer id to payForm
					if(installmentsResponse.issuer && installmentsResponse.issuer.id){
						this.payForm.patchValue({
							"issuer": installmentsResponse.issuer.id
						});
					}
				}
			)
		}
	}

	//Private methods
	private initMP() {
		//Init SDK
		this.mercadoPagoService.initSDK();

		//Fetch paymet methods
		this.mercadoPagoService.fetchPaymentMethod().subscribe((response: any[]) => {
			//Load filter credit card and debit cards
			this.paymentMethods = response.filter((pm: any) => {
				return pm.payment_type_id != 'credit_card' && pm.payment_type_id != 'debit_card';
			});
		})

		//Load MP identification methods
		this.mercadoPagoService.fetchIdentificationTypes().subscribe((identificationTypes: any[]) => {
			this.identificationTypes = identificationTypes;

			//Suggest form, first type
			if (identificationTypes && identificationTypes.length) {
				this.cardForm.patchValue({
					"docType": identificationTypes[0].id
				});
			}
		});

		//Inital trigger for testing
		//The card number test value is valid
		this.onCardNumberChange();
	}

	private fetchUserCards(){
		//Start loading
		this.loading = true;

		//Clear cards
		this.cards = [];

		//Request
		this.cartService.fetchCards().subscribe(
			(cards: any) => {
				//TODO: Change typeas CardModel[]
				//Load cards
				this.cards = cards;

				//Stop loading
				this.loading = false;
			},
			(error: any) => {
				//Stop loading
				this.loading = false;
			}
		);
	}

	private createOrderAndPay(){
		//Start loading
		this.loading = true;
		
		//Get selected card
		let payObj: any = this.payForm.value;
		let card: any = this.getSelectedCard();
		let paymentMethodType: string = payObj.paymentMethodType

		//Check pay with card???
		if(card){
			//Get cardToken + cvv token
			this.mercadoPagoService.createCardToken({
				"cardId": card.cardId,
                "securityCode": payObj.cvv
			}).subscribe(
				(response: any) => {
					//Check payment token
					if(response.id){
						//Proceed with payment
						this.payOrder(card.cardType, response.id, payObj.issuer, payObj.installments);
					}
				},
				(error: any) => {
					//Stop loading
					this.loading = false;
				});
			return;
		} 

		//Pay with abitab
		this.payOrder(paymentMethodType);
	}

	private payOrder(paymentMethodType: string, cardToken?: string, cardIssuer?: string, cardInstallments?: number){
		//TODO: Use your cart object
		//Create order object
		let order: any = {
			"items":[
				{"product":22,"quantity":1},
				{"product":1,"quantity":1,"price":0}
			],
			"name":"Gustavo",
			"last_name":"Rodriguez",
			"phone":"095324204",
			"email":"ncorso@gmail.com",
			"document":"42521866",
			"company_name":"Bloque",
			"company_rut":"123456123456",
			"user_id": "39",
			"address":"",
			"state":"",
			"countryIso":"",
			"city":"",
			"extra_data": {"paymentMethod":1},
			"total":1,
			"paymentMethodType": paymentMethodType,
			"payment_gateway": 1
		};

		//Check card values
		if(cardToken && cardIssuer && cardInstallments){
			order.card = {
				"token": cardToken,
				"issuer_id": cardIssuer,
				"installments": cardInstallments
			};
		}

		//Do request
		this.cartService.createOrder(order).subscribe(
			(response: any) => {
				//Clear pay form
				this.payForm.reset();

				//console
				console.log(response);

				//Stop loading
				this.loading = false;
			},
			(error: any) => {
				//Stop loading
				this.loading = false;

				//Error
				console.warn(error);
			}
		);
	}

	private getSelectedCard(): any{
		return this.payForm.value.card ? this.cards.filter(c => c.id == this.payForm.value.card).pop() : null;
	}

	//JUST FOR TEST METHODS
	onLogin() {
		this.login();
	}

	private login() {
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
				this.fetchUserCards();
			},
			(error: any) => {
				this.loading = false;
			}
		);
	}

	private loadSession() {
		let token: string = localStorage.getItem('mp_access_token');

		//Check token
		if (token) {
			this.accessToken = JSON.parse(token);
		}
	}
}
