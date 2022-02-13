  import { Component, OnInit } from '@angular/core';
  import { AppService } from '../app.service';
  import { Snippet } from '../models/Snippet.model';
  import { DomSanitizer } from '@angular/platform-browser';
  import { Tapestry } from '../models/Tapestry.model';
  import { SnippetOut } from '../models/SnippetOut.model';

  @Component({
    selector: 'home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
  })
  export class HomeComponent implements OnInit {
    uploadLoading: boolean = false;
    pausePlay: string = "play_arrow";
    videoClock: string = "00:00"
    sectionHide: string = "upload"
    volumeHover = false
    interval!: number;
    mousedown!: boolean;
    tapestryLoading: boolean = false
    snippetsLoading: boolean = false
    selectedFile: File | null = null
    loadingText!: string;

    snippetList!: Snippet[];
    snippetPool: Snippet[] = []
    activeSnippetList: Snippet[] = []
    sliderContainerRect!: DOMRect;
    previewSliderWidth: number = 0;
    snippetOut!: SnippetOut;
    previewSnippet!: Snippet;
    tapestry!: Tapestry;
    tapestryVidEl!: HTMLVideoElement;
    previewSliderDiv!: HTMLElement;

    constructor( 
      private appService: AppService,
      private sanitizer: DomSanitizer
      ) {} 
    
    async ngOnInit() {
      this.uploadLoading = false;
      this.loadingText = "Stitching your video into the current animation..."
      this.tapestryLoading = true
      this.snippetsLoading = true
      this.setInitialVariables()

      // this.appService.getAllSnippetsMetadata().subscribe((snippetList: Snippet[]) => {
      //   this.snippetList = snippetList
      //   this.appService.getAllSnippetsVideoStreams(this.snippetList)
      // })
  
      this.appService.getTapestry().subscribe((tapestry: Blob) => {               
        this.tapestry.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(tapestry))  
      })
    }

    updateTimeElements() {
      this.videoClock = new Date(this.tapestry.videoDiv.currentTime * 1000).toISOString().substring(14, 19)  
      this.tapestry.currentTimePct = (this.tapestryVidEl.currentTime / this.tapestryVidEl.duration) * 100
      const isSnippetActiveCheck = (snippet: Snippet) => this.tapestry.currentTimePct >= snippet.timeStartPct && this.tapestry.currentTimePct <= snippet.timeEndPct
      const isSnippetLoaded = this.snippetPool.length > 0 || this.selectedFile != null
      const isSnippetActive = this.snippetPool.some(isSnippetActiveCheck) || (this.tapestry.currentTimePct >= this.previewSnippet.timeStartPct && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPct)
      
      if (isSnippetLoaded) {
        console.log("loaded");
        this.updateActiveSnippetList() 
        console.log(this.activeSnippetList);
               
        if (isSnippetActive) {
          console.log("active");
          this.activeSnippetList.map((snippet: Snippet) => {
            this.showActiveSnippet(snippet)
          })
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
      const isSnippetLoaded = this.snippetPool.length > 0 || this.selectedFile != null
      const isSnippetActive = this.activeSnippetList.length > 0

      if (isSnippetLoaded) {        
        this.updateActiveSnippetList()
        if (isSnippetActive) {          
          this.activeSnippetList.map((snippet: Snippet) => {
            this.showActiveSnippet(snippet)
            this.jumpSnippetToTime(snippet, mouseClick)
          })
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
        this.interval = window.setInterval(() => (this.setSnippetTime(snippet), 1000))
      }
    }

    createSnippetFromFile(event: any) {
      this.selectedFile = event.target.files[0] as File;
      this.previewSnippet.videoStreamUrl = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(this.selectedFile))
      
      this.previewSnippet.videoDiv.onloadedmetadata = () => {
          const sliderRect = (document.getElementById("preview-slider-thumb") as HTMLElement).getBoundingClientRect()          
          this.previewSnippet.timeStartPct = ((sliderRect.left - this.sliderContainerRect.left) / this.sliderContainerRect.width) * 100,
          this.previewSnippet.durationPct =  (this.previewSnippet.videoDiv.duration / this.tapestry.videoDiv.duration) * 100,
          this.previewSnippet.timeEndPct = this.previewSnippet.timeStartPct + this.previewSnippet.durationPct,
          this.previewSnippet.visible = true        
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

    // jumpPreviewSnippetToTime(mouseClick: MouseEvent) {
    //   const mouseClickPosSnippet = ((mouseClick.clientX - this.previewSnippet.sliderRect.left) / this.previewSnippet.sliderRect.width) * 100
    //   this.previewSnippet.currentTime = (mouseClickPosSnippet * this.previewSnippet.videoEl.duration) / 100;
    // }
  
    updateActiveSnippetList() {
      const outputList: Snippet[] = []
      this.snippetPool.map((snippet: Snippet) => {
        if (this.tapestry.currentTimePct >= snippet.timeStartPct && this.tapestry.currentTimePct <= snippet.timeEndPct) {
          outputList.push(snippet)
        }
      })          
      if (this.tapestry.currentTimePct >= this.previewSnippet.timeStartPct && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPct) {
        outputList.push(this.previewSnippet)
      }
      this.activeSnippetList = outputList
    }

    showActiveSnippet(snippet: Snippet) {
      snippet.visible = true;
      snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement  
      if (!this.tapestry.videoDiv.paused && snippet.videoDiv.paused) {
        // snippet.videoDiv.src = snippet.videoStreamUrl
        
        snippet.videoDiv.play()
      }
    }

    // showActivePreviewSnippets() {
    //   if (this.previewSnippet.file != null) {        
    //     if (this.tapestry.currentTimePct >= this.previewSnippet.timeStartPos && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPos) {
    //       if (!this.tapestry.videoDiv.paused && this.previewSnippet.videoEl.paused) {
    //         this.previewSnippet.videoEl.play()
    //       }
    //       this.previewSnippet.visible = true
    //     } else {
    //       this.previewSnippet.visible = false
    //     }
    //   } 
    // }

    setSnippetTime(snippet: Snippet) {
      if (document.getElementById("snippet-pool-el-" + snippet.id) != null && document.getElementById("snippet-videoEl-" + snippet.id) != null) {
        const snippetSlider = document.getElementById("snippet-pool-el-" + snippet.id) as HTMLElement
        const tapestryVid = document.getElementById("tapestry-videoEl") as HTMLVideoElement
        snippet.videoDiv = document.getElementById("snippet-videoEl-" + snippet.id) as HTMLVideoElement          
              
        
        // snippet.videoDiv.src = snippet.videoStreamUrl
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
      const sectionNames: string[] = ["upload"]
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
      const sliderRect = (document.getElementById("preview-slider-thumb") as HTMLElement).getBoundingClientRect();
      const snippetActiveCheck = this.tapestry.currentTimePct >= this.previewSnippet.timeStartPct && this.tapestry.currentTimePct <= this.previewSnippet.timeEndPct
      this.previewSnippet.timeStartPct = ((sliderRect.left - this.sliderContainerRect.left) / this.sliderContainerRect.width) * 100
      this.previewSnippet.timeEndPct = ((sliderRect.right - this.sliderContainerRect.left) / this.sliderContainerRect.width) * 100
      if (snippetActiveCheck) {
        this.previewSnippet.currentTime = ((this.tapestry.currentTimePct - this.previewSnippet.timeStartPct) / this.previewSnippet.durationPct) * this.previewSnippet.videoDiv.duration
      }
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

    uploadFile() {
      if (this.selectedFile != null) {
        this.snippetOut = {
          videoStream: this.selectedFile as Blob,
          user: "system",
          videoName: this.selectedFile.name,
          timeStart: (this.previewSnippet.timeStartPct / 100) * this.tapestry.videoDiv.duration,
          timeEnd: (this.previewSnippet.timeEndPct / 100) * this.tapestry.videoDiv.duration,
          duration: (this.previewSnippet.durationPct / 100) * this.tapestry.videoDiv.duration,
        }
        this.appService.uploadFile(this.snippetOut).subscribe(response => {
          this.uploadLoading = true
          console.log(response)
          this.uploadLoading = false
        })
      }
    }

    setInitialVariables() {
      this.sectionSelect("upload")
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
        id: "preview",
        videoDiv: document.getElementById("snippet-videoEl-preview") as HTMLVideoElement,
        videoStreamUrl: "",
        user: "",
        timeStartPct: 0,
        timeEndPct: 0,
        durationPct: 0,
        currentTime: 0,
        upvote: 0,
        downvote: 0,
        visible: true,
      }
    }
  }
