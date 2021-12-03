import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) {}

  getVideo(): Observable<any> {
    const headers = new HttpHeaders({'Content-Type': 'video/mp4', 'Accept-Ranges':'bytes'});
    return this.http.get("http://localhost:4200/api/final-video.mp4", {'headers': headers, responseType: 'blob'});
  }
}
