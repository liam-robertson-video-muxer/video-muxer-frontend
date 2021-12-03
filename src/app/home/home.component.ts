import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  myVideo: any;

  constructor(
    private appService: AppService
  ) { }

  ngOnInit(): void {
    this.appService.getVideo().subscribe(mp4 => {
      let dataType = mp4.type;
      let binaryData = [];
      binaryData.push(mp4);
      let videoEl = <HTMLVideoElement>document.getElementById("myVideoEl")
      videoEl.src = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
      // let downloadLink = document.createElement('video');
      // downloadLink.src = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
      // console.log(downloadLink.src);
      document.body.appendChild(videoEl);
      // if (filename)
      //     downloadLink.setAttribute('download', filename);
      // document.body.appendChild(downloadLink);
      // downloadLink.click();
      
    });
  }
}
