import { CdkDragDrop, CdkDragMove } from '@angular/cdk/drag-drop';
import { AfterViewInit, Component, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AppService } from '../app.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  selectedFile!: File;
  pausePlay: string = "play_arrow";
  tapestry!: HTMLVideoElement;
  juiceWidth: number = 0;
  currentTime: number = 0;
  duration!: number;
  timeMinsSecs: string = "00:00"
  snippetBool: boolean = false;
  snippetPlayBool: boolean = false;
  previewSnippet!: HTMLVideoElement;
  snippetSlider!: HTMLElement;
  draggableSnippetStart: number = 0
  draggableSnippetEnd!: number;

  constructor(
    private appService: AppService
    ) {}
  
  ngOnInit(): void {
    this.tapestry = document.getElementById("tapestry") as HTMLVideoElement;
    this.getVideo();
  }

  getVideo() {
    this.appService.getVideo().subscribe(videoFile => {
      const dataType = videoFile.type;
      const binaryData = [];
      binaryData.push(videoFile);
      this.tapestry.src = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
    });  
  }

  selectFile(event: any) {
    this.selectedFile = event.target.files[0];    
    this.previewSnippet = document.getElementById("snippet-preview") as HTMLVideoElement;
    this.previewSnippet.style.display = "initial"
    this.previewSnippet.src = window.URL.createObjectURL(this.selectedFile);
    this.previewSnippet.onloadedmetadata = this.setSnippetWidth()
    this.draggableSnippetEnd = this.previewSnippet.duration
    this.snippetSlider = document.getElementById("draggable-snippet") as HTMLElement;
    this.snippetSlider.style.width = "20px"
    console.log(this.previewSnippet.duration);
    
  }
  setSnippetWidth() {
    this.draggableSnippetEnd = this.duration
    console.log(this.draggableSnippetEnd);
    
    return null
  }

   onUpload() {
    this.appService.uploadFile(this.selectedFile).subscribe(responseCode => 
      {
        console.log(responseCode);
      }
    )
  }

  onTimeUpdate(){
    this.juiceWidth = (this.tapestry.currentTime / this.tapestry.duration) * 100;
    this.currentTime = this.tapestry.currentTime
    this.duration = this.tapestry.duration
    this.timeMinsSecs = this.timeConversion(this.currentTime)
  }

  timeConversion(time: number) {
    const rounded: number = Math.round(time)
    const timeMins: number = Math.floor(rounded / 60)
    const timeMinSecs = `${timeMins} : ${rounded - (timeMins * 60)}`
    return timeMinSecs
  }

  togglePlayPause() {               
    if (this.pausePlay == "play_arrow") {
      this.tapestry.play();
      this.pausePlay = "pause"
    } else {
      this.tapestry.pause();
      this.pausePlay = "play_arrow"
    }
  }

  sliderDropped(event: CdkDragMove<number>) {
    this.draggableSnippetStart += event.distance.x
    this.draggableSnippetEnd += event.distance.x
    console.log(event.distance)
  }

  jumpToTime(event: { clientX: number; clientY: number; }) {
    const orangeBarEl = document.getElementById("orange-bar") as HTMLElement;
    const startXCoord = orangeBarEl.getBoundingClientRect().left
    const endXCoord = orangeBarEl.getBoundingClientRect().right - startXCoord
    const currentXCoord = event.clientX - startXCoord
    const widthClickPercent =  (currentXCoord / endXCoord);
   
    this.tapestry.currentTime = widthClickPercent * this.tapestry.duration;
  }
}
