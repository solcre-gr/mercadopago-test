import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from "rxjs/operators";

import { environment } from 'src/environments/environment';

@Injectable({
	"providedIn": "root"
})
export class CartService {
	//Inject services
	constructor(
		private httpClient: HttpClient) { }


	public createCard(mpCardToken: string, mpPaymentMethod: string): Observable<any> {
		//TODO: Use apiService and map as CardModel
		//Post options
		const httpOptions = {
			headers: new HttpHeaders({
				'Authorization': 'Bearer ' + JSON.parse(
					localStorage.getItem('mp_access_token')
				).access_token,
				'Accept': 'application/vnd.ecommerce.v2+json'
			})
		}

		//Url
		const url: string = environment.apiURL + environment.cardsURI;

		//Do request
		return this.httpClient
			.post(url, {
				"token": mpCardToken,
				"paymentMethodType": mpPaymentMethod
			}, httpOptions);
	}

	public fetchCards(): Observable<any> {
		//TODO: Use apiService and map as CardModel
		//Post options
		const httpOptions = {
			headers: new HttpHeaders({
				'Authorization': 'Bearer ' + JSON.parse(
					localStorage.getItem('mp_access_token')
				).access_token,
				'Accept': 'application/vnd.ecommerce.v2+json'
			})
		}

		//Url
		const url: string = environment.apiURL + environment.cardsURI;

		//Do request
		return this.httpClient.get(url, httpOptions).pipe(
			map((response: any) => {
				//TODO: Map response as CardModel
				//check embedded
				if(response && response._embedded){
					return response._embedded.users_cards;
				}
			})
		);
	}

	public createOrder(order: any): Observable<any>{
		//TODO: Use apiService

		//Url
		const url: string = environment.apiURL + environment.ordersURI;

		//Post options
		const httpOptions = {
			headers: new HttpHeaders({
				'Authorization': 'Bearer ' + JSON.parse(
					localStorage.getItem('mp_access_token')
				).access_token,
				'Accept': 'application/vnd.ecommerce.v2+json'
			})
		}

		//Do request with hardcoded data
		return this.httpClient.post(url, order, httpOptions);
	}
}