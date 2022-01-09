import { CdkDragMove } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  pausePlay: string = "play_arrow";
  timeMinsSecs: string = "00:00"
  juiceWidth: number = 0;
  draggableSnippetStart: number = 0
  draggableSnippetEnd!: number;
  tapestry!: HTMLVideoElement;     

  constructor(
    private appService: AppService
    ) {}
  
  ngOnInit(): void {
    this.tapestry = document.getElementById("tapestry") as HTMLVideoElement;
    this.getTapestryVideo();
  }

  createSnippetFromFile(event: any) {
    const selectedFile = event.target.files[0];   
    const snippetVideo = document.getElementById("snippet-video") as HTMLVideoElement;
    this.createSnippet(snippetVideo, selectedFile)
  }


////////////////////////////////////////////////////////////////////////////////////////////////////////


  getTapestryVideo() { 
    this.appService.getVideo().subscribe(videoFile => {
      const dataType = videoFile.type;
      const binaryData = [];
      binaryData.push(videoFile);
      this.tapestry.src = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
    });  
  }

  createSnippet(snippetVideo: HTMLVideoElement, selectedFile: File) {
    snippetVideo.style.display = "initial"
    snippetVideo.src = window.URL.createObjectURL(selectedFile);
    snippetVideo.onloadedmetadata = () => {
      const snippetSlider = document.getElementById("snippet-slider") as HTMLElement;
      snippetSlider.style.width = ((snippetVideo.duration / this.tapestry.duration) * 100).toString() + "%"
      this.draggableSnippetEnd = snippetSlider.clientWidth
    };    
  }

  snippetOnCheck(snippetStart: number, snippetEnd: number, tapestry: HTMLVideoElement, snippet: HTMLVideoElement) {
    if (tapestry.currentTime >= snippetStart && tapestry.currentTime <= snippetEnd) {
      snippet.style.display = "initial"
    } else {
      snippet.style.display = "none"
    }
  }

  updateTimeElements(){
    this.juiceWidth = (this.tapestry.currentTime / this.tapestry.duration) * 100;
    this.timeMinsSecs = this.timeConversion(this.tapestry.currentTime)
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

  sliderMoved(event: CdkDragMove<number>) {
    this.draggableSnippetStart += event.distance.x
    this.draggableSnippetEnd += event.distance.x
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
