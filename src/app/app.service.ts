import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SnippetOut } from './models/SnippetOut.model';
import { Snippet } from './models/Snippet.model';
import { SnippetVideoStream } from './models/SnippetVideoStream.model';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) {}

  getTapestry(): Observable<Blob> {
    return this.http.get("http://" + environment.env + "getTapestry", {responseType: "blob"});
  }

  getSnippetsData(): Observable<Snippet[]> {
     return this.http.get<Snippet[]>("http://" + environment.env + "getAllSnippets", {responseType: "json"})
  }

  getSnippetVideoStreams(): Observable<SnippetVideoStream[]> {
    return this.http.get<SnippetVideoStream[]>("http://" + environment.env + "getAllSnippetVideoStreams", {responseType: "json"})
  }

  uploadFile(snippet: SnippetOut): Observable<any> {
    const formData = new FormData();
    formData.append("file", snippet.file);
    return this.http.post("http://" + environment.env + "updateAnimation", formData, )
  }
}
