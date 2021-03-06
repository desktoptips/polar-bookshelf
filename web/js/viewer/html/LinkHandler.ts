import {shell} from 'electron';
import {IFrames} from '../../util/dom/IFrames';
import {DocumentReadyStates} from '../../util/dom/DocumentReadyStates';
import {Logger} from '../../logger/Logger';
import {Events} from '../../util/dom/Events';

const log = Logger.create();

/**
 * The link handler works with the the iframe, and all child iframes, and
 * intercepts all link clicks, and aborts them, forwarding them to the shell.
 */
export class LinkHandler {

    private readonly iframe: HTMLIFrameElement;

    constructor(iframe: HTMLIFrameElement) {
        this.iframe = iframe;
    }

    async start() {

        let doc = await IFrames.waitForContentDocument(this.iframe);

        await DocumentReadyStates.waitFor(doc, 'interactive');

        // now setup child iframe handlers
        Array.from(doc.querySelectorAll('iframe'))
            .map( current => new LinkHandler(current))
            .forEach( linkHandler => linkHandler.start() );

        this.setupEventHandlers(doc);


    }

    private setupEventHandlers(doc: HTMLDocument) {
        this.setupClickHandlers(doc);
        this.setupKeyDownHandlers(doc);
        this.setupBeforeUnload(doc);

        log.info("Added event handlers to prevent link navigation");

    }

    private setupClickHandlers(doc: HTMLDocument) {

        // click and enter need to be aborted here..
        doc.querySelectorAll('a')
            .forEach(anchor => anchor.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                this.handleLinkEvent(event);
            }));

    }

    private setupKeyDownHandlers(doc: HTMLDocument) {

        doc.querySelectorAll('a')
            .forEach(anchor => anchor.addEventListener('keydown', event => {

                if(event.key === 'Enter' || event.key === 'Return') {
                    event.preventDefault();
                    event.stopPropagation();
                    this.handleLinkEvent(event);
                }

            }));

    }

    private handleLinkEvent(event: Event) {

        let anchor = Events.getAnchor(event.target);

        if(anchor) {
            let href = anchor.href;
            log.info("Opening URL: " + href);
            shell.openExternal(href);
        }

    }

    private setupBeforeUnload(doc: HTMLDocument) {

        // prevent the document from being unloaded.
        doc.addEventListener('beforeunload', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });

    }

}
