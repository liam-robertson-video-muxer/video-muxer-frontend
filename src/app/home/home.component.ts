import { CdkDragMove } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { AppService } from '../app.service';
import { Snippet } from '../models/Snippet.model';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  pausePlay: string = "play_arrow";
  timeMinsSecs: string = "00:00"
  juiceWidth: number = 0;
  tapestry!: HTMLVideoElement;     
  snippetVideo!: HTMLVideoElement;
  snippetStartPx: number = 0;
  snippetEndPx!: number;
  snippetStartTime!: number;
  snippetEndTime!: number;
  pxPerSecondConversion!: number;
  barWidthPx!: number;
  orangeBarPos!: number;
  snippetWidthPx!: number;
  sectionHide: string = "browse"
  snippetList!: Snippet[];

  constructor(
    private appService: AppService
    ) {}
  
  ngOnInit(): void {
    const browseButton: HTMLElement = document.getElementById("browse-button") as HTMLElement
    browseButton.click()
    this.tapestry = document.getElementById("tapestry") as HTMLVideoElement;
    this.getTapestryVideo();
    this.getSnippets();
    this.barWidthPx = (document.getElementById("orange-bar") as HTMLElement).offsetWidth
    this.tapestry.onloadedmetadata = () => {
      this.pxPerSecondConversion = this.barWidthPx / this.tapestry.duration   
    };   
  }

  createSnippetFromFile(event: any) {
    const selectedFile = event.target.files[0];   
    this.snippetVideo = document.getElementById("snippet-video") as HTMLVideoElement;
    this.snippetVideo.muted = true
    this.createSnippet(selectedFile)
  }

  getSnippets() {
    this.appService.getSnippets().subscribe((snippetList: Snippet[]) => {
      this.snippetList = snippetList
      this.createSnippetTimeline(snippetList)})
  }

  getTapestryVideo() { 
    this.appService.getTapestry().subscribe(videoFile => {
      const dataType = videoFile.type;
      const binaryData = [];
      binaryData.push(videoFile);
      this.tapestry.src = window.URL.createObjectURL(new Blob(binaryData, {type: dataType}));
    });  
  }


////////////////////////////////////////////////////////////////////////////////////////////////////////

  createSnippetTimeline(snippetList: Snippet[]) {
    snippetList.map((snippet: Snippet) => {
      const snippetIndex = this.snippetList.indexOf(snippet)
      const snippetWidth = (this.snippetList[snippetIndex].timeEnd - this.snippetList[snippetIndex].timeStart) * this.pxPerSecondConversion
      const snippetDiv = document.getElementById('snippet ' + snippetIndex) as HTMLElement
      snippetDiv.style.width = snippetWidth.toString() + "px"
    })
  }

  // createSnippetTimeline(snippetList: Snippet[]) {
  //   snippetList.map((snippet: Snippet) => {
  //     const snippetWidth = (snippet.timeEnd - snippet.timeStart) * this.pxPerSecondConversion
  //     const parentDiv = document.getElementById("browse-section") as HTMLElement
  //     const snippetDiv = document.createElement('div');
  //     parentDiv?.appendChild(snippetDiv)
  //     snippetDiv.setAttribute("id", "test");
  //     snippetDiv.setAttribute("class", "snippet-bar");
  //     snippetDiv.style.width = snippetWidth.toString() + "px"
  //     snippetDiv.style.height = "20px"
  //     snippetDiv.style.margin = "10px 0"
  //     snippetDiv.style.borderRadius = "10px"
  //     snippetDiv.style.marginLeft  = (snippet.timeStart * this.pxPerSecondConversion).toString() + "px"
  //     snippetDiv.style.backgroundColor = "red"
  //   })
  // }

  // getSnippets() { 
  //   this.appService.getSnippets().subscribe((snippetList: Snippet[]) => {
  //     snippetList.map((snippet: Snippet) => {
  //       const blobPart = new Blob([new Uint8Array(snippet.videoStream)], {type: "application/octet-stream"})
  //       const binaryData = [];
  //       binaryData.push(blobPart);
  //       // this.tapestry.src = window.URL.createObjectURL(new Blob(binaryData, {type: "application/octet-stream"}));
  //     })
  //   });  
  // }

  sectionSelect(sectionName: string) {
    const sectionNames: string[] = ["upload", "browse", "comments"]
    this.sectionHide = sectionName
    sectionNames.map(currentSection => {
      const currentButton: HTMLElement = document.getElementById(currentSection + "-button") as HTMLElement
      if (sectionName == currentSection) {
        currentButton.style.backgroundColor = "rgba(173, 173, 173, 0.63)"
      } else {
        currentButton.style.backgroundColor = "rgba(230, 230, 230, 0.63)"
      }
    })
  }

  createSnippet(selectedFile: File) {
    this.snippetVideo.style.display = "initial"
    this.snippetVideo.src = window.URL.createObjectURL(selectedFile);
    this.snippetVideo.onloadedmetadata = () => {
      const snippetSlider = document.getElementById("snippet-slider") as HTMLElement;
      snippetSlider.style.width = ((this.snippetVideo.duration / this.tapestry.duration) * 100).toString() + "%"
      this.snippetEndPx = this.snippetVideo.duration * this.pxPerSecondConversion
    };    
  }

  // Moving slider
  sliderMoved(event: CdkDragMove<number>) {
    this.orangeBarPos = (document.getElementById("orange-bar") as HTMLElement).getBoundingClientRect().left
    this.snippetWidthPx = (document.getElementById("snippet-slider") as HTMLElement).offsetWidth 
    const sliderPos = (document.getElementById("snippet-slider") as HTMLElement).getBoundingClientRect().left
    this.snippetStartPx = sliderPos - this.orangeBarPos
    this.snippetEndPx = this.snippetStartPx + this.snippetWidthPx
    this.snippetStartTime = this.snippetStartPx / this.pxPerSecondConversion
    this.snippetEndTime = this.snippetEndPx / this.pxPerSecondConversion
    this.snippetCheckOnMove()
  }

  snippetCheckOnMove() {
    if (this.tapestry.currentTime >= this.snippetStartTime && this.tapestry.currentTime <= this.snippetEndTime) {
      this.snippetVideo.currentTime = this.tapestry.currentTime - this.snippetStartTime
      this.snippetVideo.style.display = "initial"
      this.snippetVideo.play()
    } else {
      this.snippetVideo.style.display = "none"
    }
  }
  ///////////////////////////////////

  snippetCheckOnTime() {
    let snippetBool = false
    
    if (this.tapestry.currentTime >= this.snippetStartTime && this.tapestry.currentTime <= this.snippetEndTime) {
      if (!snippetBool) {
        this.snippetVideo.currentTime = this.tapestry.currentTime - this.snippetStartTime
      }
      snippetBool = true
      this.snippetVideo.style.display = "initial"
      this.snippetVideo.play()
    } else {
      snippetBool = false
      this.snippetVideo.style.display = "none"
    }
  }

  updateTimeElements(){
    this.juiceWidth = (this.tapestry.currentTime / this.tapestry.duration) * 100;
    this.timeMinsSecs = this.timeConversion(this.tapestry.currentTime)
    this.snippetCheckOnTime()
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

  jumpToTime(event: { clientX: number; clientY: number; }) {
    const orangeBarEl = document.getElementById("orange-bar") as HTMLElement;
    const startXCoord = orangeBarEl.getBoundingClientRect().left
    const endXCoord = orangeBarEl.getBoundingClientRect().right - startXCoord
    const currentXCoord = event.clientX - startXCoord
    const widthClickPercent =  (currentXCoord / endXCoord);
   
    this.tapestry.currentTime = widthClickPercent * this.tapestry.duration;
  }
}
