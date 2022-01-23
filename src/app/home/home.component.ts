import { Component, OnInit, SecurityContext } from '@angular/core';
import { AppService } from '../app.service';
import { Snippet } from '../models/Snippet.model';
import { SnippetOut } from '../models/SnippetOut.model';
import { SnippetPreview } from '../models/SnippetPreview.model';
import { SnippetRaw } from '../models/SnippetRaw.model';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Tapestry } from '../models/Tapestry.model';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  pausePlay: string = "play_arrow";
  timeMinsSecs: string = "00:00"
  sectionHide: string = "browse"
  snippetList!: Snippet[];
  snippetPool: Snippet[] = []
  previewSnippet!: SnippetPreview;
  previewSnippetStartTime: number = 0;
  sliderContainer!: HTMLElement;
  previewSliderThumb!: HTMLInputElement;
  tapestryVidEl!: HTMLVideoElement;     
  snippetVidEl!: HTMLVideoElement;   
  tapestryCurrentTime: number = 0
  currentSliderXpcnt: number = 0
  mainSliderXpcnt: number = 0
  mousedown!: boolean;
  mainSliderContainer!: HTMLInputElement;
  snippetOut!: SnippetOut;
  selectedFile!: File;
  showSnippetVidEl: boolean = false;
  loading: boolean = true
  volumeHover = false
  showTapestryVidEl = true
  snippetLoadedId: number | null = null
  tapestryVideoUrl!: SafeUrl
  tapestry: Tapestry = {
    videoDiv: document.getElementById("tapestry-videoEl") as HTMLVideoElement,
    videoStreamUrl: "",
    visible: true,
  }
  interval!: number;

  constructor( 
    private appService: AppService,
    private sanitizer:DomSanitizer
    ) {} 
   
  ngOnInit(): void { 
    this.setInitialVariables()     
    this.appService.getTapestry().subscribe((tapestry: Blob) => {
      this.tapestry.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(tapestry))

      this.appService.getRawSnippets().subscribe((rawSnippetList: SnippetRaw[]) => {
        this.snippetList = this.refineRawSnippets(rawSnippetList, this.tapestryVidEl.duration)        
      })
    });  
  }

  refineRawSnippets(rawSnippetList: SnippetRaw[], tapestryDuration: number) {
    const snippetList: Snippet[] = []
    rawSnippetList.map((rawSnippet: SnippetRaw) => { 
      const blobPart = new Blob([new Uint8Array(rawSnippet.videoStream)], {type: "application/octet-stream"})
      const binaryData = [];
      binaryData.push(blobPart); 

      const currSnippet: Snippet = {
        id: rawSnippet.id,
        videoDiv: document.getElementById("snippet-videoEl-" + rawSnippet.id) as HTMLVideoElement,
        videoStreamUrl: this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(new Blob(binaryData, {type: "application/octet-stream"}))),
        user: rawSnippet.user,
        timeStartPos: (rawSnippet.timeStart / tapestryDuration) * 100,
        timeEndPos: (rawSnippet.timeEnd / tapestryDuration) * 100,
        durationWidth: (rawSnippet.duration / tapestryDuration) * 100,
        currentTime: 0,
        upvote: rawSnippet.upvote,
        downvote: rawSnippet.downvote,
        visible: false,
      }
      snippetList.push(currSnippet)
    })
    return snippetList
  }

  setInitialVariables() {
    this.sectionSelect("browse")
    this.tapestryVidEl = document.getElementById("tapestry-videoEl") as HTMLVideoElement; 
    this.snippetVidEl = document.getElementById("snippet-videoEl") as HTMLVideoElement; 
    this.sliderContainer = document.getElementById("slider-container") as HTMLElement
    this.previewSliderThumb = document.getElementById("preview-slider-thumb") as HTMLInputElement
    const mainSlider = document.getElementById("main-slider") as HTMLInputElement
    this.mainSliderContainer = document.getElementById("main-slider-container") as HTMLInputElement
    this.mainSliderContainer.addEventListener('dragstart', (e) => {
      e.preventDefault()
    })
    mainSlider.style.width = ((this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100).toString() + "%"
    this.previewSnippet = {
      file: new File(new Array<Blob>(), "Mock.zip", { type: 'application/zip' }),
      videostreamUrl: "",
      user: "",
      videoType: "",
      timeStartPos: 0,
      timeEndPos: 0,
      durationWidth: 0,
    }
  }

  createSnippetFromFile(event: any) {
    this.selectedFile = event.target.files[0];
    this.snippetVidEl.muted = true
    this.snippetVidEl.onloadedmetadata = () => {
      
      this.previewSnippet.durationWidth = (this.snippetVidEl.duration / this.tapestryVidEl.duration) * 100
      const previewSliderRect = this.previewSliderThumb.getBoundingClientRect()
      const sliderContainerRect = this.sliderContainer.getBoundingClientRect()

      this.previewSnippet = {
        file: this.selectedFile,
        videostreamUrl: window.URL.createObjectURL(this.selectedFile),
        user: "liam",
        videoType: this.selectedFile.type,
        timeStartPos: ((previewSliderRect.left - sliderContainerRect.left) / sliderContainerRect.width) * 100,
        timeEndPos: ((previewSliderRect.right - sliderContainerRect.left) / sliderContainerRect.width) * 100,
        durationWidth: (this.snippetVidEl.duration / this.tapestryVidEl.duration) * 100,
      }
    }
  }

  updateTimeElements() {
    this.timeMinsSecs = new Date(this.tapestryVidEl.currentTime * 1000).toISOString().substring(14, 19)
    const tapestryTimePcnt = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
    this.showHideSnippets(tapestryTimePcnt)
    if (this.selectedFile != undefined) {
      if (tapestryTimePcnt >= this.previewSnippet.timeStartPos && tapestryTimePcnt <= this.previewSnippet.timeEndPos) {
        this.tapestry.visible = false
        // this.snippetVidEl.src = (this.previewSnippet.videostreamUrl, "snippet-videoEl")
        // this.showSnippetVidEl = true
      }
    }
  }

  showHideSnippets(tapestryTimePcnt: number) {
    const isSnippetLoadedCheck = (snippet: Snippet) => tapestryTimePcnt >= snippet.timeStartPos && tapestryTimePcnt <= snippet.timeEndPos
    if (this.snippetPool.length > 0) {
      if (this.snippetPool.some(isSnippetLoadedCheck)) {        
        this.snippetPool.map((snippet: Snippet) => {
          if (tapestryTimePcnt >= snippet.timeStartPos && tapestryTimePcnt <= snippet.timeEndPos) {       
            snippet.visible = true;
            snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement            
            if (snippet.videoDiv != null) {
              snippet.videoDiv.play()      
              this.tapestry.visible = false
            }
          } else {
            snippet.visible = false
            this.tapestry.visible = true
          }
        })
      } else {
        this.snippetPool.map((snippet: Snippet) => snippet.visible = false)
        this.tapestry.visible = true
      } 
    }  else {
      this.snippetPool.map((snippet: Snippet) => snippet.visible = false)
      this.tapestry.visible = true
    } 
  }


  // User triggered events
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  loadSnippetToPool(snippet: Snippet) {   
    if (this.snippetPool.includes(snippet)) {
      this.snippetPool = this.snippetPool.filter(currSnippet => currSnippet != snippet)
    } else {
      this.snippetPool.push(snippet)      
      snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement
      this.interval = window.setInterval(() => (this.setSnippetTime(snippet), 1000))
    }
    const tapestryTimePcnt = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
    this.showHideSnippets(tapestryTimePcnt)
  }

  setSnippetTime(snippet: Snippet) {
    if (document.getElementById("snippet-pool-el-" + snippet.id) != null && document.getElementById("snippet-videoEl-" + snippet.id) != null) {
      const tapestryCurrentTimePos = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
      const snippetSlider = document.getElementById("snippet-pool-el-" + snippet.id) as HTMLElement
      const tapestryVid = document.getElementById("tapestry-videoEl") as HTMLVideoElement
      snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement
      const snippetTimePos = (((tapestryCurrentTimePos * tapestryVid.getBoundingClientRect().width) - snippetSlider.getBoundingClientRect().left) / snippetSlider.getBoundingClientRect().width)
      snippet.videoDiv.onloadedmetadata = () => {
        snippet.currentTime = (snippetTimePos * snippet.videoDiv.duration) / 100;
        clearInterval(this.interval);
      }
    }
  }

  previewSliderDrag() {
    const previewSliderRect = this.previewSliderThumb.getBoundingClientRect()
    const sliderContainerRect = this.sliderContainer.getBoundingClientRect()

    this.previewSnippet.timeStartPos = ((previewSliderRect.left - sliderContainerRect.left) / sliderContainerRect.width) * 100
    this.previewSnippet.timeEndPos = ((previewSliderRect.right - sliderContainerRect.left) / sliderContainerRect.width) * 100
    this.previewSnippet.durationWidth = (previewSliderRect.width / sliderContainerRect.width) * 100
  }

  selectFile() {
    (document.getElementById("selectFile") as HTMLInputElement).click()
  }

  jumpToTime(xPosPcnt: number) {
    this.tapestryVidEl.currentTime = (xPosPcnt * this.tapestryVidEl.duration) / 100
  }

  jumpToTimeClick(event: MouseEvent) {
    const sliderContainerDiv = document.getElementById("slider-container") as HTMLElement;
    const sliderContainerWidth = sliderContainerDiv.getBoundingClientRect().width
    const mouseClickPos = (event.clientX - sliderContainerDiv.getBoundingClientRect().left) / sliderContainerDiv.getBoundingClientRect().width * 100
    this.tapestryVidEl.currentTime = ((event.clientX - sliderContainerDiv.getBoundingClientRect().left) / sliderContainerWidth) * this.tapestryVidEl.duration;
    this.timeMinsSecs = new Date(this.tapestryVidEl.currentTime * 1000).toISOString().substring(14, 19)

    const tapestryTimePcnt = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
    const isSnippetLoadedCheck = (snippet: Snippet) => tapestryTimePcnt >= snippet.timeStartPos && tapestryTimePcnt <= snippet.timeEndPos
    if (this.snippetPool.length > 0) {
      if (this.snippetPool.some(isSnippetLoadedCheck)) {
        this.snippetPool.map((snippet: Snippet) => {
          if (mouseClickPos >= snippet.timeStartPos && mouseClickPos <= snippet.timeEndPos) {  
            const snippetSlider = document.getElementById("snippet-pool-el-" + snippet.id) as HTMLVideoElement
            snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement
            const mouseClickPosSnippet = ((event.clientX - snippetSlider.getBoundingClientRect().left) / snippetSlider.getBoundingClientRect().width) * 100
                     
            snippet.currentTime = (mouseClickPosSnippet * snippet.videoDiv.duration) / 100;
            snippet.visible = true
            snippet.videoDiv.play()
            this.tapestry.visible = false
          } else {
            snippet.visible = false
            this.tapestry.visible = true
          }
        })
      } else {
        this.snippetPool.map((snippet: Snippet) => snippet.visible = false)
        this.tapestry.visible = true
      } 
    }  else {
      this.snippetPool.map((snippet: Snippet) => snippet.visible = false)
      this.tapestry.visible = true
    } 
  }

  togglePlayPause() {
    switch (this.pausePlay) {
      case "play_arrow":       
        if (this.showSnippetVidEl) {
          this.snippetVidEl.play();
        } 
        this.tapestryVidEl.play();
        this.pausePlay = "pause"
        break;

      case "pause":       
        if (this.showSnippetVidEl) {
          this.snippetVidEl.pause();
        } 
        this.tapestryVidEl.pause();
        this.pausePlay = "play_arrow"
        break;
    }
  }

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

  mouseDown(event: MouseEvent) {
    this.mousedown = true
    this.jumpToTimeClick(event)
  }

  mainSliderDragged(event: MouseEvent) {    
    if (this.mousedown) {
      this.jumpToTimeClick(event)
    }
  }

  uploadFile() {
    this.snippetOut = {
      file: this.previewSnippet.file,
      user: "liam",
      videoType: this.previewSnippet.videoType,
      timeStart: (this.previewSnippet.timeStartPos / 100) * this.tapestryVidEl.duration,
      timeEnd: (this.previewSnippet.timeEndPos / 100) * this.tapestryVidEl.duration,
      duration: (this.previewSnippet.durationWidth / 100) * this.tapestryVidEl.duration,
  }
    this.appService.uploadFile(this.snippetOut)
    
  }


  // Tools
  ////////////////////////////////////////////////////////////////////////////////////////////////////////

  setVideoSrc(videoStream: ArrayBuffer, videoElementId: string) {
    const videoDiv = document.getElementById(videoElementId) as HTMLVideoElement;
    const blobPart = new Blob([new Uint8Array(videoStream)], {type: "application/octet-stream"})
    const binaryData = [];
    binaryData.push(blobPart);
    videoDiv.src = window.URL.createObjectURL(new Blob(binaryData, {type: "application/octet-stream"}));
  }
  
}
