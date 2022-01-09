import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
