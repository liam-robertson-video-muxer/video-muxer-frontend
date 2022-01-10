import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Snippet } from './models/Snippet.model';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) {}

  getTapestry(): Observable<any> {
    return this.http.get("http://" + environment.env + "getTapestry", {responseType: "blob"});
  }

  getSnippets(): Observable<Snippet[]> {
     return this.http.get<Snippet[]>("http://" + environment.env + "getAllSnippets", {responseType: "json"})
  }

  uploadFile(selectedFile: File): Observable<any> {
    const formData = new FormData();
    formData.append("file", selectedFile);
    return this.http.post("http://" + environment.env + "updateAnimation", formData, )
  }
}


// getSnippets() { 
//   this.appService.getSnippets().subscribe((snippetList: Snippet[]) => {
//     snippetList.map((snippet: Snippet) => {
//       const blobPart = new Blob([new Uint8Array(snippet.videoStream)], {type: "application/octet-stream"})
//       const binaryData = [];
//       binaryData.push(blobPart);
//       this.tapestry.src = window.URL.createObjectURL(new Blob(binaryData, {type: "application/octet-stream"}));
//     })
//   });  
// }