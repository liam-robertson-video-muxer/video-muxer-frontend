import { Injectable, Input } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { finalize, Observable, Subscription } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) {}

  getVideo(): Observable<any> {
    return this.http.get("http://" + environment.env + "getTapestry", {responseType: "blob"});
  }

  uploadFile(selectedFile: File): Observable<any> {
    const formData = new FormData();
    formData.append("file", selectedFile);
    return this.http.post("http://" + environment.env + "updateAnimation", formData, )
  }
}
