import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  selectedFile: any = null;
  selectedFilename: string = "";

  constructor(
    private appService: AppService
    ) {}


  ngOnInit(): void {
    this.getVideo();
  }


  getVideo() {
    this.appService.getVideo().subscribe(videoFile => {
      const dataType = videoFile.type;
      const binaryData = [];
      binaryData.push(videoFile);
      const videoElement = <HTMLVideoElement>document.getElementById("videoPlayer")
      videoElement.src = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
    });  
  }

  selectFile(event: any) {
    this.selectedFile = event.target.files[0];
    this.selectedFilename = this.selectedFile.name;
  }

   onUpload() {
    this.appService.uploadFile(this.selectedFile).subscribe(responseCode => 
      {
        console.log(responseCode);
      }
    )
  }
}
