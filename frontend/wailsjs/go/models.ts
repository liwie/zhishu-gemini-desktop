export namespace client {
	
	export class ChatMessage {
	    role: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new ChatMessage(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.role = source["role"];
	        this.content = source["content"];
	    }
	}

}

export namespace main {
	
	export class ChatResult {
	    model: string;
	    content: string;
	
	    static createFrom(source: any = {}) {
	        return new ChatResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.model = source["model"];
	        this.content = source["content"];
	    }
	}
	export class ImageItem {
	    url: string;
	    b64_json: string;
	    mime: string;
	
	    static createFrom(source: any = {}) {
	        return new ImageItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.url = source["url"];
	        this.b64_json = source["b64_json"];
	        this.mime = source["mime"];
	    }
	}
	export class ImageResult {
	    model: string;
	    image_url: string;
	    urls: string[];
	    b64_json: string;
	    images: ImageItem[];
	
	    static createFrom(source: any = {}) {
	        return new ImageResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.model = source["model"];
	        this.image_url = source["image_url"];
	        this.urls = source["urls"];
	        this.b64_json = source["b64_json"];
	        this.images = this.convertValues(source["images"], ImageItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class VideoResult {
	    status: string;
	    video_url: string;
	    video_data_url: string;
	    id: string;
	
	    static createFrom(source: any = {}) {
	        return new VideoResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.video_url = source["video_url"];
	        this.video_data_url = source["video_data_url"];
	        this.id = source["id"];
	    }
	}

}

