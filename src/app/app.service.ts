import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SnippetRaw } from './models/SnippetRaw.model';
import { SnippetOut } from './models/SnippetOut.model';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(private http: HttpClient) {}

  getTapestry(): Observable<Blob> {
    return this.http.get("http://" + environment.env + "getTapestry", {responseType: "blob"});
  }

  getRawSnippets(): Observable<SnippetRaw[]> {
     return this.http.get<SnippetRaw[]>("http://" + environment.env + "getAllSnippets", {responseType: "json"})
  }

  uploadFile(snippet: SnippetOut): Observable<any> {
    const formData = new FormData();
    formData.append("file", snippet.file);
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