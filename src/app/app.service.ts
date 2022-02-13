import { Injectable, SecurityContext } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SnippetOut } from './models/SnippetOut.model';
import { Snippet } from './models/Snippet.model';
import { DomSanitizer } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  constructor(
    private http: HttpClient, 
    private sanitizer: DomSanitizer) {}

  getTapestry(): Observable<Blob> {
    return this.http.get("http://" + environment.env + "getTapestry", {responseType: "blob"});
  }

  getAllSnippetsMetadata(): Observable<Snippet[]> {
    const snippetMetadata: Observable<Snippet[]> = this.http.get("http://" + environment.env + "getAllSnippetsMetadata", {responseType: "json"})
    .pipe(map((snippetRawList: any) => {
      const snippetList: Snippet[] = snippetRawList.map((snippetIn: any) => {
        const snippet: Snippet = {
          id: snippetIn.id, 
          videoDiv: document.getElementById("snippet-videoEl-" + snippetIn.id) as HTMLVideoElement,
          videoStreamUrl:   this.sanitizer.bypassSecurityTrustUrl(""),
          user: snippetIn.user,
          timeStartPct: snippetIn.timeStart,
          timeEndPct: snippetIn.timeEnd,
          durationPct: snippetIn.duration,
          currentTime: 0,
          upvote: snippetIn.upvote,
          downvote: snippetIn.downvote,
          visible: false
        }          
        return snippet
      })        
      return snippetList
    }))        
    return snippetMetadata
  }

  getAllSnippetsVideoStreams(snippetList: Snippet[]): void {
    snippetList.map((snippet: Snippet) => {
      this.http.get("http://" + environment.env + "getSnippetVideoStream?id=" + snippet.id, {responseType: "blob"}).subscribe((videoStream: Blob) => {
        snippet.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(videoStream))  
      })
    })
  }

  uploadFile(snippet: SnippetOut): Observable<string> {   
    const formData = new FormData()
    formData.append('user', snippet.user); 
    formData.append('videoName', snippet.videoName);
    formData.append('videoStream', snippet.videoStream);
    formData.append('timeStart', snippet.timeStart.toString());
    formData.append('timeEnd', snippet.timeEnd.toString());
    formData.append('duration', snippet.duration.toString());
    return this.http.post<string>("http://" + environment.env + "addSnippetToTapestry", formData)
    .pipe(catchError(this.errorHandler));
  }

  errorHandler(error: HttpErrorResponse) {
    console.log(error);
    
    alert(error.error)
    return throwError(() => error);
  }
}
