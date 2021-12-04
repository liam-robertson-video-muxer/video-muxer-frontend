import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { finalize } from 'rxjs';

@Component({
  selector: 'file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent{

  constructor(private http: HttpClient) {}

  @Input()
    requiredFileType: string | undefined;

    fileName = '';
    uploadProgress: any;
    uploadSub: any;

  onFileSelected(event: any) { 
    const file: File = event.target.files[0];
  
    if (file) {
        this.fileName = file.name;
        const formData = new FormData();
        formData.append("thumbnail", file);

        const upload$ = this.http.post("/api/home/upload", formData, {
            reportProgress: true,
            observe: 'events'
        }) 
        .pipe(
            finalize(() => this.reset())
        );
      
        this.uploadSub = upload$.subscribe(event => {
          if (event.type == HttpEventType.UploadProgress) {
            if (event.total) {  
              const total: number = event.total;  
              this.uploadProgress = Math.round(100 * event.loaded / total);    
          }  
          }
        })
      }
  }

  cancelUpload() {
    this.uploadSub.unsubscribe();
    this.reset();
  }

  reset() {
    this.uploadProgress = null;
    this.uploadSub = null;
  }
  

}
