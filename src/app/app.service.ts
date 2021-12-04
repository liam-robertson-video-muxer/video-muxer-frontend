import { Injectable, Input } from '@angular/core';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import { finalize, Observable, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) {}

  getVideo(): Observable<any> {
    const headers = new HttpHeaders({'Content-Type': 'video/mp4', 'Accept-Ranges':'bytes'});
    return this.http.get("http://localhost:4200/api/final-video.mp4", {'headers': headers, responseType: 'blob'});
  }

  uploadFile(selectedFile: File): Observable<any> {
    const formData = new FormData();
    formData.append("file", selectedFile);
    return this.http.post("/api/home/upload", formData, )
  }
}
