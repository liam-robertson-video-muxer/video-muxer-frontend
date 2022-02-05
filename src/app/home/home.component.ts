  import { Component, OnInit } from '@angular/core';
  import { AppService } from '../app.service';
  import { Snippet } from '../models/Snippet.model';
  import { SnippetPreview } from '../models/SnippetPreview.model';
  import { DomSanitizer } from '@angular/platform-browser';
  import { Tapestry } from '../models/Tapestry.model';
  import { SnippetVideoStream } from '../models/SnippetVideoStream.model';
  import { SnippetOut } from '../models/SnippetOut.model';

  @Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
  })
  export class HomeComponent implements OnInit {
    pausePlay: string = "play_arrow";
    videoClock: string = "00:00"
    sectionHide: string = "browse"
    volumeHover = false
    interval!: number;
    mousedown!: boolean;
    tapestryLoading: boolean = false
    snippetsLoading: boolean = false
    selectedFile: File | null = null

    snippetList!: Snippet[];
    snippetPool: Snippet[] = []
    activeSnippetList: Snippet[] = []
    sliderContainerRect!: DOMRect;
    previewSliderWidth: number = 0;
    snippetOut!: SnippetOut;
    previewSnippet!: SnippetPreview;
    tapestry!: Tapestry;
    tapestryVidEl!: HTMLVideoElement;
    previewSliderDiv!: HTMLElement;

    constructor( 
      private appService: AppService,
      private sanitizer: DomSanitizer
      ) {} 

    // snippet.videoStreamUrl = window.URL.createObjectURL(new Blob([snippetVideoStream.videoStream], {type: "application/octet-stream"}))
    // snippet.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(new Blob([snippetVideoStream.videoStream], {type: "application/octet-stream"})))
    
    ngOnInit(): void {
      this.tapestryLoading = true
      this.snippetsLoading = true
      this.appService.getTapestry().subscribe((tapestry: Blob) => {             
        this.tapestry.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(tapestry))  
        this.appService.getAllSnippets().subscribe((snippetList: Snippet[]) => {
          this.snippetList = snippetList
          })
        })
      this.setInitialVariables()
    }

    updateTimeElements() {
      this.videoClock = new Date(this.tapestry.videoDiv.currentTime * 1000).toISOString().substring(14, 19)  
      this.tapestry.currentTimePct = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
      const isSnippetActiveCheck = (snippet: Snippet) => this.tapestry.currentTimePct >= snippet.timeStartPct && this.tapestry.currentTimePct <= snippet.timeEndPct
      const isPreviewSnippetActiveCheck = this.tapestry.currentTimePct >= this.previewSnippet.timeStartPos && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPos
      const isSnippetLoaded = this.snippetPool.length > 0 || this.selectedFile != null
      const isSnippetActive = this.snippetPool.some(isSnippetActiveCheck) || isPreviewSnippetActiveCheck
      
      if (isSnippetLoaded) {
        if (isSnippetActive) {
          this.updateActiveSnippetList()
          this.activeSnippetList.map((snippet: Snippet) => {
            this.showActiveSnippet(snippet)
          })
          this.showActivePreviewSnippets()
          this.tapestry.visible = false
        } else {
          this.tapestry.visible = true 
        }
      } else {
        this.tapestry.visible = true
      }
    }

    jumpToTimeClick(mouseClick: MouseEvent) {
      this.videoClock = new Date(this.tapestry.videoDiv.currentTime * 1000).toISOString().substring(14, 19)  
      const sliderContainerRect: DOMRect = (document.getElementById("slider-container") as HTMLElement).getBoundingClientRect() as DOMRect;
      this.tapestry.currentTime = ((mouseClick.clientX - sliderContainerRect.left) / sliderContainerRect.width) * this.tapestry.videoDiv.duration;
      this.tapestry.currentTimePct = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
      const isSnippetActiveCheck = (snippet: Snippet) => this.tapestry.currentTimePct >= snippet.timeStartPct && this.tapestry.currentTimePct <= snippet.timeEndPct
      const isPreviewSnippetActiveCheck = this.tapestry.currentTimePct >= this.previewSnippet.timeStartPos && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPos
      const isSnippetLoaded = this.snippetPool.length > 0 || this.selectedFile != null
      const isSnippetActive = this.snippetPool.some(isSnippetActiveCheck) || isPreviewSnippetActiveCheck

      if (isSnippetLoaded) {
        if (isSnippetActive) {
          this.updateActiveSnippetList()
          this.activeSnippetList.map((snippet: Snippet) => {
            this.showActiveSnippet(snippet)
            this.jumpSnippetToTime(snippet, mouseClick)
          })
          if (this.previewSnippet.file != null && isPreviewSnippetActiveCheck) {
            this.previewSnippet.visible = true
            this.jumpPreviewSnippetToTime(mouseClick)
          } else {
            this.previewSnippet.visible = false
          }
          this.tapestry.visible = false
        } else {
          this.tapestry.visible = true 
        }
      } else {
        this.tapestry.visible = true
      }
    }

    togglePlayPause() {
      switch (this.pausePlay) {
        case "play_arrow":       
        this.pausePlaySnippet()
        this.tapestry.videoDiv.play();      
        this.pausePlay = "pause"
        break;

        case "pause":  
        this.pausePlaySnippet()
        this.tapestry.videoDiv.pause();
        this.pausePlay = "play_arrow"
        break;
      }
    }

    loadSnippetToPool(snippet: Snippet) {   
      if (this.snippetPool.includes(snippet)) {
        this.snippetPool = this.snippetPool.filter(currSnippet => currSnippet != snippet)
      } else {
        this.snippetPool.push(snippet)      
        // const snippetVideoEl = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement
        
        // snippetVideoEl.src = window.URL.createObjectURL(new Blob([snippet.videoStream], {type: "application/octet-stream"}))
    // snippet.videoStreamUrl = window.URL.createObjectURL(new Blob([snippetVideoStream.videoStream], {type: "application/octet-stream"}))
    // snippet.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(new Blob([snippetVideoStream.videoStream], {type: "application/octet-stream"})))
        
        this.interval = window.setInterval(() => (this.setSnippetTime(snippet), 1000))
      }
    }

    createSnippetFromFile(event: any) {    
      let counter = 0
      this.selectedFile = event.target.files[0] as File;
      this.previewSnippet.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(this.selectedFile))
      
      this.previewSnippet.videoEl.onloadedmetadata = () => {
        if (counter != 1) {
          counter += 1
          this.previewSliderWidth =   (this.previewSnippet.videoEl.duration / this.tapestry.videoDiv.duration) * 100
          this.previewSnippet.sliderRect = (document.getElementById("preview-slider-thumb") as HTMLElement).getBoundingClientRect()
          console.log(this.selectedFile as File);
          console.log(this.selectedFile?.arrayBuffer);

          this.previewSnippet = {
            file: this.selectedFile as File,
            videoEl:  document.getElementById("preview-snippet-videoEl") as HTMLVideoElement,
            sliderRect:  (document.getElementById("preview-snippet-videoEl") as HTMLVideoElement).getBoundingClientRect(),
            videoStreamUrl: this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(this.selectedFile as File)),
            user: "liam",
            currentTime: 0,
            videoType: this.selectedFile!.type,
            timeStartPos: ((this.previewSliderDiv.getBoundingClientRect().left - this.previewSnippet.videoEl.getBoundingClientRect().left) / this.sliderContainerRect.width) * 100,
            timeEndPos: ((this.previewSliderDiv.getBoundingClientRect().right - this.previewSnippet.videoEl.getBoundingClientRect().left) / this.sliderContainerRect.width) * 100,
            durationWidth: (this.previewSnippet.videoEl.duration / this.tapestry.videoDiv.duration) * 100,
            visible: true,
          }
        }
      }
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    mouseDown(event: MouseEvent) {
      this.mousedown = true
      this.jumpToTimeClick(event)
    }

    jumpSnippetToTime(snippet: Snippet, mouseClick: MouseEvent) {
      const snippetSliderRect: DOMRect = (document.getElementById("snippet-pool-el-" + snippet.id) as HTMLVideoElement).getBoundingClientRect() as DOMRect
      const mouseClickPosSnippet = ((mouseClick.clientX - snippetSliderRect.left) / snippetSliderRect.width) * 100
      snippet.currentTime = (mouseClickPosSnippet * snippet.videoDiv.duration) / 100;
    }

    jumpPreviewSnippetToTime(mouseClick: MouseEvent) {
      const mouseClickPosSnippet = ((mouseClick.clientX - this.previewSnippet.sliderRect.left) / this.previewSnippet.sliderRect.width) * 100
      this.previewSnippet.currentTime = (mouseClickPosSnippet * this.previewSnippet.videoEl.duration) / 100;
    }
  
    updateActiveSnippetList() {
      const outputList: Snippet[] = []
      this.snippetPool.map((snippet: Snippet) => {
        if (this.tapestry.currentTimePct >= snippet.timeStartPct && this.tapestry.currentTimePct <= snippet.timeEndPct) {
          outputList.push(snippet)
        }
      })
      this.activeSnippetList = outputList
    }

    showActiveSnippet(snippet: Snippet) {
      snippet.visible = true;
      snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement  
      if (!this.tapestry.videoDiv.paused && snippet.videoDiv.paused) {
        snippet.videoDiv.play()
      }
    }

    showActivePreviewSnippets() {
      if (this.previewSnippet.file != null) {
        if (this.tapestry.currentTimePct >= this.previewSnippet.timeStartPos && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPos) {
          this.previewSnippet.visible = true
        } else {
          this.previewSnippet.visible = false
        }
      } 
    }

    setSnippetTime(snippet: Snippet) {
      if (document.getElementById("snippet-pool-el-" + snippet.id) != null && document.getElementById("snippet-videoEl-" + snippet.id) != null) {
        const snippetSlider = document.getElementById("snippet-pool-el-" + snippet.id) as HTMLElement
        const tapestryVid = document.getElementById("tapestry-videoEl") as HTMLVideoElement
        snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement        
        
    // snippet.videoDiv.src = window.URL.createObjectURL(new Blob([snippet.videoStream], {type: "application/octet-stream"}))    
    snippet.videoDiv.src = (window.URL.createObjectURL(snippet.videoStream))
        const snippetTimePos = (((this.tapestry.currentTimePct * tapestryVid.getBoundingClientRect().width) - snippetSlider.getBoundingClientRect().left) / snippetSlider.getBoundingClientRect().width)
        snippet.videoDiv.onloadedmetadata = () => {
          snippet.currentTime = (snippetTimePos * snippet.videoDiv.duration) / 100;
        }
      }
    }

    selectFile() {
      (document.getElementById("selectFile") as HTMLInputElement).click()
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

  
    mainSliderDragged(event: MouseEvent) {    
      if (this.mousedown) {
        this.jumpToTimeClick(event)
      }
    }

    previewSliderDrag() {
      this.previewSnippet.timeStartPos = ((this.previewSnippet.sliderRect.left - this.sliderContainerRect.left) / this.sliderContainerRect.width) * 100
      this.previewSnippet.timeEndPos = ((this.previewSnippet.sliderRect.right - this.sliderContainerRect.left) / this.sliderContainerRect.width) * 100
      this.previewSnippet.durationWidth = (this.previewSnippet.sliderRect.width / this.sliderContainerRect.width) * 100
    }

    pausePlaySnippet() {
      this.activeSnippetList.map((snippet: Snippet) => {
        if (this.pausePlay == "play_arrow") {
          snippet.videoDiv.play()
        } else if ((this.pausePlay == "pause")) {
          snippet.videoDiv.pause()
        }
      })
    }

    async uploadFile() {
      console.log(this.previewSnippet.file);
      console.log(this.previewSnippet.videoStreamUrl);
      console.log(this.previewSnippet);
      console.log(this.tapestry.videoDiv.duration);

      // const mData = JSON.stringify(modelData);
      // const formData = new FormData();
      // formData.append('data', mData);

      if (this.previewSnippet.file != null) {
        // const videoData = new FormData()
        // videoData.append('video stream', this.previewSnippet.file, this.previewSnippet.file.name);
        // console.log(videoData);
        // console.log(this.previewSnippet.file);
      //   const fileReader = new FileReader();
      //   let array = []
      //   fileReader.onload = function() {
      //     array = this.result;
      // };
      //   fileReader.readAsArrayBuffer(this.previewSnippet.file);
        // await new Response(this.previewSnippet.file).arrayBuffer()
        console.log(new Blob([this.previewSnippet.file as Blob], {type: "application/octet-stream"}));
        
        this.snippetOut = {
          videoStream: this.previewSnippet.file as Blob,
          user: "system",
          videoType: this.previewSnippet.videoType,
          timeStart: (this.previewSnippet.timeStartPos / 100) * this.tapestry.videoDiv.duration,
          timeEnd: (this.previewSnippet.timeEndPos / 100) * this.tapestry.videoDiv.duration,
          duration: (this.previewSnippet.durationWidth / 100) * this.tapestry.videoDiv.duration,
        }
        this.appService.uploadFile(this.snippetOut).subscribe(response => console.log(response))
      }
    }

    setInitialVariables() {
      this.sectionSelect("browse")
      this.setTapestry()
      this.setPreviewSnippet()
      this.sliderContainerRect = (document.getElementById("slider-container") as HTMLElement).getBoundingClientRect();
      (document.getElementById("main-slider-container") as HTMLInputElement).addEventListener('dragstart', (e) => {
        e.preventDefault()
      })
    }

    setTapestry() {
      this.tapestryVidEl = document.getElementById("tapestry-videoEl") as HTMLVideoElement
      this.tapestry = {
        videoDiv: this.tapestryVidEl,
        currentTime: this.tapestryVidEl.currentTime,
        currentTimePct: (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100,
        videoStreamUrl: "",
        visible: true,
      }
      this.tapestry.videoDiv.onloadedmetadata = () => {
        this.tapestry.currentTimePct = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
      }
    }

    setPreviewSnippet() {
      this.previewSliderDiv = document.getElementById("preview-slider-thumb") as HTMLElement
      this.previewSnippet = {
        file: new File(new Array<Blob>(), "Mock.zip", { type: 'application/zip' }),
        videoEl: document.getElementById("preview-snippet-videoEl") as HTMLVideoElement,
        sliderRect: (document.getElementById("preview-snippet-videoEl") as HTMLVideoElement).getBoundingClientRect(),
        videoStreamUrl: "",
        user: "",
        videoType: "",
        currentTime: 0,
        timeStartPos: 0,
        timeEndPos: 0,
        durationWidth: 0,
        visible: false,
      }
    }
  }
