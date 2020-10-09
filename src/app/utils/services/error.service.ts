import { Injectable, ErrorHandler } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserDetails } from '../interfaces/userDetails';
import { environment } from 'src/environments/environment';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {

  constructor(private http: HttpClient,
    private sessionService: SessionService) { }

  handleError(error: Error) {
    const self = this;
    if (error.message.startsWith('ExpressionChangedAfterItHasBeenCheckedError')
      || error.message.startsWith('Http failure response')) {
      return;
    }
    const payload: LogsPayload = {};
    const temp = self.sessionService.getUser();
    let user: UserDetails = {};
    if (temp) {
      user = JSON.parse(temp);
    }
    payload.message = error.message;
    payload.stackTrace = error.stack;
    payload.name = error.name;
    payload.message = error.message;
    payload.userId = user._id;
    payload.type = 'author';
    const URL = environment.url.log + '/mon/ui/logs';
    const httpHeaders: HttpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json; version=2')
      .set('Authorization', 'JWT ' + self.sessionService.getToken());
    self.http
      .post(URL, payload, { headers: httpHeaders })
      .subscribe(res => {

      }, err => {

      });
    if (!environment.production) {
      throw error;
    }
  }
}

export interface LogsPayload {
  userId?: string;
  name?: string;
  message?: string;
  stackTrace?: string;
  type?: string;
}
