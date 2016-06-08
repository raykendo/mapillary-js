/// <reference path="../../../typings/index.d.ts" />

import * as rx from "rx";
import * as vd from "virtual-dom";

import {
    ComponentService,
    Component,
    DirectionDOMRenderer,
    IDirectionConfiguration,
} from "../../Component";
import {Node} from "../../Graph";
import {IVNodeHash, RenderCamera} from "../../Render";
import {Container, Navigator} from "../../Viewer";

/**
 * @class DirectionComponent
 * @classdesc Component showing navigation arrows for steps and turns.
 */
export class DirectionComponent extends Component {
    /** @inheritdoc */
    public static componentName: string = "direction";

    private _renderer: DirectionDOMRenderer;

    private _hoveredKey$: rx.Observable<string>;

    private _configurationSubscription: rx.IDisposable;
    private _nodeSubscription: rx.IDisposable;
    private _renderCameraSubscription: rx.IDisposable;

    constructor(name: string, container: Container, navigator: Navigator) {
        super(name, container, navigator);

        this._renderer = new DirectionDOMRenderer(this.defaultConfiguration, container.element);

        this._hoveredKey$ = rx.Observable
            .combineLatest(
                this._container.domRenderer.element$,
                this._container.renderService.renderCamera$,
                this._container.mouseService.mouseMove$.startWith(null),
                this._container.mouseService.mouseUp$.startWith(null),
                (e: Element, rc: RenderCamera, mm: MouseEvent, mu: MouseEvent): Element => {
                    return e;
                })
            .map<string>(
                (element: Element): string => {
                    let hovered: Element = null;

                    let steps: NodeListOf<Element> = element.getElementsByClassName("Directions");

                    for (let i: number = 0; i < steps.length; i++) {
                        hovered = steps.item(i).querySelector(":hover");

                        if (hovered != null && hovered.hasAttribute("data-key")) {
                            return hovered.getAttribute("data-key");
                        }
                    }

                    let turns: NodeListOf<Element> = element.getElementsByClassName("DirectionsPerspective");

                    for (let i: number = 0; i < steps.length; i++) {
                        hovered = turns.item(i).querySelector(":hover");

                        if (hovered != null && hovered.hasAttribute("data-key")) {
                            return hovered.getAttribute("data-key");
                        }
                    }

                    return null;
                })
            .distinctUntilChanged()
            .share();
    }

   /**
    * Get default configuration.
    *
    * @returns {IDirectionConfiguration}
    */
    public get defaultConfiguration(): IDirectionConfiguration {
        return {
            distinguishSequence: false,
            maxWidth: 460,
            minWidth: 260,
        };
    }

    /**
     * Get hovered key observable.
     *
     * @description An observable emitting the key of the node for the direction
     * arrow that is being hovered. When the mouse leaves a direction arrow null
     * is emitted.
     *
     * @returns {Observable<string>}
     */
    public get hoveredKey$(): rx.Observable<string> {
        return this._hoveredKey$;
    }

    /**
     * Set highlight key.
     *
     * @description The arrow pointing towards the node corresponding to the
     * highlight key will be highlighted.
     *
     * @param {string} highlightKey Key of node to be highlighted if existing
     * among arrows.
     */
    public setHighlightKey(highlightKey: string): void {
        this.configure({ highlightKey: highlightKey });
    }

    /**
     * Set min width of container element.
     *
     * @description  Set min width of the non transformed container element holding
     * the navigation arrows. If the min width is larger than the max width the
     * min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @param {number} minWidth
     */
    public setMinWidth(minWidth: number): void {
        this.configure({ minWidth: minWidth });
    }

    /**
     * Set max width of container element.
     *
     * @description Set max width of the non transformed container element holding
     * the navigation arrows. If the min width is larger than the max width the
     * min width value will be used.
     *
     * The container element is automatically resized when the resize
     * method on the Viewer class is called.
     *
     * @param {number} minWidth
     */
    public setMaxWidth(maxWidth: number): void {
        this.configure({ maxWidth: maxWidth });
    }

    /** @inheritdoc */
    public resize(): void {
        this._renderer.resize(this._container.element);
    }

    protected _activate(): void {
        this._configurationSubscription = this._configuration$
            .subscribe(
                (configuration: IDirectionConfiguration): void => {
                    this._renderer.setConfiguration(configuration);
                });

        this._nodeSubscription = this._navigator.stateService.currentNode$
            .do(
                (node: Node): void => {
                    this._container.domRenderer.render$.onNext({name: this._name, vnode: vd.h("div", {}, [])});
                })
            .subscribe(
                (node: Node): void => {
                    this._renderer.setNode(node);
                });

        this._renderCameraSubscription = this._container.renderService.renderCameraFrame$
            .do(
                (renderCamera: RenderCamera): void => {
                    this._renderer.setRenderCamera(renderCamera);
                })
            .map<DirectionDOMRenderer>(
                (renderCamera: RenderCamera): DirectionDOMRenderer => {
                    return this._renderer;
                })
            .filter(
                (renderer: DirectionDOMRenderer): boolean => {
                    return renderer.needsRender;
                })
            .map<IVNodeHash>(
                (renderer: DirectionDOMRenderer): IVNodeHash => {
                    return { name: this._name, vnode: renderer.render(this._navigator) };
                })
            .subscribe(this._container.domRenderer.render$);
    }

    protected _deactivate(): void {
        this._configurationSubscription.dispose();
        this._nodeSubscription.dispose();
        this._renderCameraSubscription.dispose();
    }
}

ComponentService.register(DirectionComponent);
export default DirectionComponent;
