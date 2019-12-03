import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
	"providedIn": "root"
})
export class CartService{
	//Inject services
	constructor(
		private httpClient: HttpClient){}

		
	public createCard(mpCardToken: string, mpPaymentMethod: string): Observable<any>{
		//TODO: Use apiService

		//Post options
		const httpOptions = {
			headers: new HttpHeaders({
				'Authorization': 'Bearer ' + JSON.parse(
					localStorage.getItem('mp_access_token')
				).access_token
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
}