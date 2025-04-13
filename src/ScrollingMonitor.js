import throttle from 'lodash.throttle';
import raf from 'raf';
import { intBetween, getCoords } from './util';

export default class ScrollingMonitor {
  constructor(dragDropManager, container, options) {
    this.dragDropManager = dragDropManager;
    this.container = container;
    this.eventBody = container.ownerDocument.body;
    this.options = options;

    this.scaleX = 0;
    this.scaleY = 0;
    this.frame = null;

    this.attached = false;
    this.dragging = false;
  }

  start() {
    this.container.addEventListener('dragover', this.handleEvent);
    // touchmove events don't seem to work across siblings, so we unfortunately
    // have to attach the listeners to the body
    this.eventBody.addEventListener('touchmove', this.handleEvent);

    // For @hello-pangea/dnd, we don't use the dragDropManager's monitor
    // Instead, we listen for the dragstart and dragend events directly
    this.eventBody.addEventListener('dragstart', this.handleDragStart);
    this.eventBody.addEventListener('dragend', this.handleDragEnd);
    
    // For react-dnd compatibility
    if (this.dragDropManager) {
      this.clearMonitorSubscription = this.dragDropManager
        .getMonitor()
        .subscribeToStateChange(() => this.handleMonitorChange());
    }
  }

  stop() {
    this.container.removeEventListener('dragover', this.handleEvent);
    this.eventBody.removeEventListener('touchmove', this.handleEvent);
    this.eventBody.removeEventListener('dragstart', this.handleDragStart);
    this.eventBody.removeEventListener('dragend', this.handleDragEnd);
    // If using react-dnd manager, clear the subscription
    if (this.clearMonitorSubscription) {
      this.clearMonitorSubscription();
    }
    this.stopScrolling();
  }

  handleEvent = evt => {
    if (this.dragging && !this.attached) {
      this.attach();
      this.updateScrolling(evt);
    }
  };

  // For @hello-pangea/dnd, we use these handlers and direct updates
  handleDragStart = () => {
    this.dragging = true;
  };

  handleDragEnd = () => {
    this.dragging = false;
    this.stopScrolling();
  };

  // Manual update method for @hello-pangea/dnd
  manualUpdateScrolling(coords) {
    if (!this.dragging) {
      this.dragging = true;
    }
    
    if (!this.attached) {
      this.attach();
    }
    
    this.updateScrollingWithCoords(coords);
  }
  
  // Update with direct coordinates instead of event
  updateScrollingWithCoords = throttle(
    coords => {
      const {
        left: x,
        top: y,
        width: w,
        height: h
      } = this.container.getBoundingClientRect();
      const box = { x, y, w, h };

      // calculate strength
      this.scaleX = this.options.horizontalStrength(box, coords);
      this.scaleY = this.options.verticalStrength(box, coords);

      // start scrolling if we need to
      if (!this.frame && (this.scaleX || this.scaleY)) {
        this.startScrolling();
      }
    },
    100,
    { trailing: false }
  );

  handleMonitorChange() {
    // Keep this for backward compatibility with react-dnd
    if (this.dragDropManager) {
      const isDragging = this.dragDropManager.getMonitor().isDragging();

      if (!this.dragging && isDragging) {
        this.dragging = true;
      } else if (this.dragging && !isDragging) {
        this.dragging = false;
        this.stopScrolling();
      }
    }
  }

  attach() {
    this.attached = true;
    this.eventBody.addEventListener('dragover', this.updateScrolling);
    this.eventBody.addEventListener('touchmove', this.updateScrolling);
  }

  detach() {
    this.attached = false;
    this.eventBody.removeEventListener('dragover', this.updateScrolling);
    this.eventBody.removeEventListener('touchmove', this.updateScrolling);
  }

  // Update scaleX and scaleY every 100ms or so
  // and start scrolling if necessary
  updateScrolling = throttle(
    evt => {
      const {
        left: x,
        top: y,
        width: w,
        height: h
      } = this.container.getBoundingClientRect();
      const box = { x, y, w, h };
      const coords = getCoords(evt);

      // calculate strength
      this.scaleX = this.options.horizontalStrength(box, coords);
      this.scaleY = this.options.verticalStrength(box, coords);

      // start scrolling if we need to
      if (!this.frame && (this.scaleX || this.scaleY)) {
        this.startScrolling();
      }
    },
    100,
    { trailing: false }
  );

  startScrolling() {
    let i = 0;
    const tick = () => {
      const { scaleX, scaleY, container } = this;
      const { strengthMultiplier, onScrollChange } = this.options;

      // stop scrolling if there's nothing to do
      if (strengthMultiplier === 0 || scaleX + scaleY === 0) {
        this.stopScrolling();
        return;
      }

      // there's a bug in safari where it seems like we can't get
      // mousemove events from a container that also emits a scroll
      // event that same frame. So we double the strengthMultiplier and only adjust
      // the scroll position at 30fps
      if (i++ % 2) {
        const {
          scrollLeft,
          scrollTop,
          scrollWidth,
          scrollHeight,
          clientWidth,
          clientHeight
        } = container;

        const newLeft = scaleX
          ? (container.scrollLeft = intBetween(
              0,
              scrollWidth - clientWidth,
              scrollLeft + scaleX * strengthMultiplier
            ))
          : scrollLeft;

        const newTop = scaleY
          ? (container.scrollTop = intBetween(
              0,
              scrollHeight - clientHeight,
              scrollTop + scaleY * strengthMultiplier
            ))
          : scrollTop;

        onScrollChange(newLeft, newTop);
      }
      this.frame = raf(tick);
    };

    tick();
  }

  stopScrolling() {
    this.detach();
    this.scaleX = 0;
    this.scaleY = 0;

    if (this.frame) {
      raf.cancel(this.frame);
      this.frame = null;
    }
  }
}
