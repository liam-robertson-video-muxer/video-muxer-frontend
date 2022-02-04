import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
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

  getAllSnippets(): Observable<Snippet[]> {
     return this.http.get<Snippet[]>("http://" + environment.env + "getAllSnippets", {responseType: "json"})
  }

  uploadFile(snippet: SnippetOut): Observable<SnippetOut> {   
    console.log("http://" + environment.env + "addSnippetToBank");
    return this.http.post<SnippetOut>("http://" + environment.env + "addSnippetToBank", snippet, ).pipe(
      catchError(this.errorHandler)
    );
  }

  errorHandler(error: HttpErrorResponse) {
    const myReader = new FileReader();
    myReader.onload = function(event){
      alert(myReader.result);
    };
    myReader.readAsText(error.error);
    return throwError(error);
  }
}
