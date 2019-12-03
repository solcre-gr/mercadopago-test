import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

//Include var to load globally MP
declare var Mercadopago: any;

@Injectable({
	"providedIn": "root"
})
export class MercadoPagoService {
	//Inject services
	constructor(
		private httpClient: HttpClient){}

	public initSDK(){
		Mercadopago.setPublishableKey("TEST-b5d66944-5a62-4c62-ac4c-4a43aa521c41");
	}

	/**
	 * Returns indicator types
	 */
	public fetchIdentificationTypes(): Observable<any[]>{
		let obs: Observable<any[]> = new Observable<any[]>(observer => {
			//Do request
			Mercadopago.getIdentificationTypes((status: number, response: any[]) => {
				//Check status
				if(status == 200){
					//Success
					observer.next(response);
					observer.complete();
				} else {
					//Error
					observer.error();
				}
			})
		});
		return obs;
	}

	/***
	 * Returns payment method from BIN number
	 */
	public getPaymentMethod(bin: string): Observable<any>{
		let obs: Observable<any> = new Observable<any>(observer => {
			//Do request
			Mercadopago.getPaymentMethod({ "bin": bin }, (status: number, response: any[]) => {
				//Check status
				if(status == 200){
					//Success
					observer.next(response[0]);
					observer.complete();
				} else {
					//Error
					observer.error();
				}
			})
		});
		return obs;
	}

	/**
	 * Returns BIN number from card number
	 * @param cardNumber Card number
	 */
	public getBin(cardNumber: string): string {
		//Control number
		if(!cardNumber){
			return '';
		}
		return cardNumber.replace(/[ .-]/g, '').slice(0, 6);
	}

	/**
	 * Returns a MP card token
	 * @param card The card object
	 */
	public createCardToken(card: any): Observable<any>{
		let obs: Observable<any> = new Observable<any>(observer => {
			//Do request
			Mercadopago.createToken(card, (status: number, response: any) => {
				//Check status
				if(status == 200){
					//Success
					observer.next(response);
					observer.complete();
				} else {
					//Error
					observer.error();
				}
			})
		});
		return obs;
	}
}