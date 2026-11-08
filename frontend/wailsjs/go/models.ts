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
	export class ImageResult {
	    model: string;
	    image_url: string;
	    urls: string[];
	    b64_json: string;
	
	    static createFrom(source: any = {}) {
	        return new ImageResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.model = source["model"];
	        this.image_url = source["image_url"];
	        this.urls = source["urls"];
	        this.b64_json = source["b64_json"];
	    }
	}
	export class VideoResult {
	    status: string;
	    video_url: string;
	    id: string;
	
	    static createFrom(source: any = {}) {
	        return new VideoResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.video_url = source["video_url"];
	        this.id = source["id"];
	    }
	}

}

