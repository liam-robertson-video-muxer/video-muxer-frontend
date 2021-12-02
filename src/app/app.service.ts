import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) {}

  getVideo(videoUrl: string): Observable<any> {
    return this.http.get(videoUrl, {responseType: 'blob'});
  }
}
