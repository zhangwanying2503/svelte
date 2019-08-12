
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(component, store, callback) {
        const unsub = store.subscribe(callback);
        component.$$.on_destroy.push(unsub.unsubscribe
            ? () => unsub.unsubscribe()
            : unsub);
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* src\views\list.svelte generated by Svelte v3.6.9 */

    const file = "src\\views\\list.svelte";

    function create_fragment(ctx) {
    	var div9, div1, div0, img, img_src_value, t0, div2, t1_value = ctx.list.shop_title, t1, t2, div3, t3_value = ctx.list.shop_type, t3, t4, div4, t5, span0, t6_value = ctx.list.price, t6, t7, div6, div5, span1, t8, span1_data_id_value, t9, p, t10_value = ctx.list.count, t10, t11, span2, t12, span2_data_id_value, t13, div7, t14, span3, t15_value = ctx.list.price*ctx.list.count, t15, t16, div8, t17, div8_remove_id_value, dispose;

    	return {
    		c: function create() {
    			div9 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div3 = element("div");
    			t3 = text(t3_value);
    			t4 = space();
    			div4 = element("div");
    			t5 = text("￥\r\n    ");
    			span0 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			div6 = element("div");
    			div5 = element("div");
    			span1 = element("span");
    			t8 = text("-");
    			t9 = space();
    			p = element("p");
    			t10 = text(t10_value);
    			t11 = space();
    			span2 = element("span");
    			t12 = text("+");
    			t13 = space();
    			div7 = element("div");
    			t14 = text("￥\r\n    ");
    			span3 = element("span");
    			t15 = text(t15_value);
    			t16 = space();
    			div8 = element("div");
    			t17 = text("删除");
    			attr(img, "src", img_src_value = ctx.list.imgSrc);
    			attr(img, "alt", "");
    			attr(img, "class", "svelte-1ot62xp");
    			add_location(img, file, 89, 6, 1498);
    			attr(div0, "class", "shop_img svelte-1ot62xp");
    			add_location(div0, file, 88, 4, 1468);
    			attr(div1, "class", "con1 svelte-1ot62xp");
    			add_location(div1, file, 87, 2, 1444);
    			attr(div2, "class", "con2 svelte-1ot62xp");
    			add_location(div2, file, 93, 2, 1558);
    			attr(div3, "class", "conk svelte-1ot62xp");
    			add_location(div3, file, 95, 2, 1605);
    			add_location(span0, file, 98, 4, 1680);
    			attr(div4, "class", "con3 svelte-1ot62xp");
    			add_location(div4, file, 96, 2, 1649);
    			span1.dataset.id = span1_data_id_value = ctx.list.id;
    			attr(span1, "type", "remove");
    			attr(span1, "class", "svelte-1ot62xp");
    			add_location(span1, file, 102, 10, 1779);
    			attr(p, "class", "svelte-1ot62xp");
    			add_location(p, file, 103, 10, 1877);
    			span2.dataset.id = span2_data_id_value = ctx.list.id;
    			attr(span2, "type", "add");
    			attr(span2, "class", "svelte-1ot62xp");
    			add_location(span2, file, 104, 10, 1908);
    			attr(div5, "class", "con4_box svelte-1ot62xp");
    			add_location(div5, file, 101, 6, 1745);
    			attr(div6, "class", "con4 svelte-1ot62xp");
    			add_location(div6, file, 100, 2, 1719);
    			add_location(span3, file, 109, 4, 2050);
    			attr(div7, "class", "con5 svelte-1ot62xp");
    			add_location(div7, file, 107, 2, 2019);
    			attr(div8, "class", "con6 svelte-1ot62xp");
    			attr(div8, "remove-id", div8_remove_id_value = ctx.list.id);
    			add_location(div8, file, 111, 2, 2100);
    			attr(div9, "class", "list_wrap svelte-1ot62xp");
    			add_location(div9, file, 86, 0, 1417);

    			dispose = [
    				listen(span1, "click", ctx.click_handler),
    				listen(span2, "click", ctx.click_handler_1),
    				listen(div8, "click", ctx.click_handler_2)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div9, anchor);
    			append(div9, div1);
    			append(div1, div0);
    			append(div0, img);
    			append(div9, t0);
    			append(div9, div2);
    			append(div2, t1);
    			append(div9, t2);
    			append(div9, div3);
    			append(div3, t3);
    			append(div9, t4);
    			append(div9, div4);
    			append(div4, t5);
    			append(div4, span0);
    			append(span0, t6);
    			append(div9, t7);
    			append(div9, div6);
    			append(div6, div5);
    			append(div5, span1);
    			append(span1, t8);
    			append(div5, t9);
    			append(div5, p);
    			append(p, t10);
    			append(div5, t11);
    			append(div5, span2);
    			append(span2, t12);
    			append(div9, t13);
    			append(div9, div7);
    			append(div7, t14);
    			append(div7, span3);
    			append(span3, t15);
    			append(div9, t16);
    			append(div9, div8);
    			append(div8, t17);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.list) && img_src_value !== (img_src_value = ctx.list.imgSrc)) {
    				attr(img, "src", img_src_value);
    			}

    			if ((changed.list) && t1_value !== (t1_value = ctx.list.shop_title)) {
    				set_data(t1, t1_value);
    			}

    			if ((changed.list) && t3_value !== (t3_value = ctx.list.shop_type)) {
    				set_data(t3, t3_value);
    			}

    			if ((changed.list) && t6_value !== (t6_value = ctx.list.price)) {
    				set_data(t6, t6_value);
    			}

    			if ((changed.list) && span1_data_id_value !== (span1_data_id_value = ctx.list.id)) {
    				span1.dataset.id = span1_data_id_value;
    			}

    			if ((changed.list) && t10_value !== (t10_value = ctx.list.count)) {
    				set_data(t10, t10_value);
    			}

    			if ((changed.list) && span2_data_id_value !== (span2_data_id_value = ctx.list.id)) {
    				span2.dataset.id = span2_data_id_value;
    			}

    			if ((changed.list) && t15_value !== (t15_value = ctx.list.price*ctx.list.count)) {
    				set_data(t15, t15_value);
    			}

    			if ((changed.list) && div8_remove_id_value !== (div8_remove_id_value = ctx.list.id)) {
    				attr(div8, "remove-id", div8_remove_id_value);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div9);
    			}

    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { list, countClick, removeClick } = $$props;

    	const writable_props = ['list', 'countClick', 'removeClick'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<List> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {countClick(event);}

    	function click_handler_1(event) {countClick(event);}

    	function click_handler_2(event) {
    		return removeClick(event);
    	}

    	$$self.$set = $$props => {
    		if ('list' in $$props) $$invalidate('list', list = $$props.list);
    		if ('countClick' in $$props) $$invalidate('countClick', countClick = $$props.countClick);
    		if ('removeClick' in $$props) $$invalidate('removeClick', removeClick = $$props.removeClick);
    	};

    	return {
    		list,
    		countClick,
    		removeClick,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	};
    }

    class List extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["list", "countClick", "removeClick"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.list === undefined && !('list' in props)) {
    			console.warn("<List> was created without expected prop 'list'");
    		}
    		if (ctx.countClick === undefined && !('countClick' in props)) {
    			console.warn("<List> was created without expected prop 'countClick'");
    		}
    		if (ctx.removeClick === undefined && !('removeClick' in props)) {
    			console.warn("<List> was created without expected prop 'removeClick'");
    		}
    	}

    	get list() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set list(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get countClick() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set countClick(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get removeClick() {
    		throw new Error("<List>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set removeClick(value) {
    		throw new Error("<List>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.6.9 */

    const file$1 = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (302:8) {#if $data.length > 0}
    function create_if_block(ctx) {
    	var each_1_anchor, current;

    	var each_value = ctx.$data;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.$data || changed.countClick || changed.removeClick) {
    				each_value = ctx.$data;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (303:10) {#each $data as item}
    function create_each_block(ctx) {
    	var div1, div0, input, input_data_id_value, input_checked_value, t0, t1, div1_class_value, current, dispose;

    	var list = new List({
    		props: {
    		list: ctx.item,
    		countClick: ctx.countClick,
    		removeClick: ctx.removeClick
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			list.$$.fragment.c();
    			t1 = space();
    			attr(input, "type", "checkbox");
    			input.dataset.id = input_data_id_value = ctx.item.id;
    			input.checked = input_checked_value = ctx.item.checkFlag;
    			attr(input, "class", "svelte-1rdm6uc");
    			add_location(input, file$1, 305, 16, 6294);
    			attr(div0, "class", "checkbox svelte-1rdm6uc");
    			add_location(div0, file$1, 304, 14, 6255);
    			attr(div1, "class", div1_class_value = "" + (ctx.item.checkFlag?'active':null) + " svelte-1rdm6uc");
    			attr(div1, "id", "list_box");
    			add_location(div1, file$1, 303, 12, 6184);
    			dispose = listen(input, "click", ctx.click_handler_1);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, input);
    			append(div1, t0);
    			mount_component(list, div1, null);
    			append(div1, t1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.$data) && input_data_id_value !== (input_data_id_value = ctx.item.id)) {
    				input.dataset.id = input_data_id_value;
    			}

    			if ((!current || changed.$data) && input_checked_value !== (input_checked_value = ctx.item.checkFlag)) {
    				input.checked = input_checked_value;
    			}

    			var list_changes = {};
    			if (changed.$data) list_changes.list = ctx.item;
    			if (changed.countClick) list_changes.countClick = ctx.countClick;
    			if (changed.removeClick) list_changes.removeClick = ctx.removeClick;
    			list.$set(list_changes);

    			if ((!current || changed.$data) && div1_class_value !== (div1_class_value = "" + (ctx.item.checkFlag?'active':null) + " svelte-1rdm6uc")) {
    				attr(div1, "class", div1_class_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(list.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(list.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			destroy_component(list);

    			dispose();
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var div18, header, t0, div17, div2, div0, img, t1, h1, t3, div1, input0, t4, button0, t6, div16, h3, t7, span0, t8_value = ctx.$data.length, t8, t9, div11, div4, div3, input1, t10, t11, div5, t13, div6, t14, div7, t16, div8, t18, div9, t20, div10, t22, div12, t23, div15, div13, input2, t24, t25, div14, p0, t26, span1, t27_value = ctx.$checkedList.length, t27, t28, t29, p1, t30, span2, t31, t32, t33, button1, current, dispose;

    	var if_block = (ctx.$data.length > 0) && create_if_block(ctx);

    	return {
    		c: function create() {
    			div18 = element("div");
    			header = element("header");
    			t0 = space();
    			div17 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t1 = space();
    			h1 = element("h1");
    			h1.textContent = "购物车";
    			t3 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "搜索";
    			t6 = space();
    			div16 = element("div");
    			h3 = element("h3");
    			t7 = text("全部商品\n        ");
    			span0 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			div11 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			input1 = element("input");
    			t10 = text("\n            全选");
    			t11 = space();
    			div5 = element("div");
    			div5.textContent = "商品";
    			t13 = space();
    			div6 = element("div");
    			t14 = space();
    			div7 = element("div");
    			div7.textContent = "单价";
    			t16 = space();
    			div8 = element("div");
    			div8.textContent = "数量";
    			t18 = space();
    			div9 = element("div");
    			div9.textContent = "小计";
    			t20 = space();
    			div10 = element("div");
    			div10.textContent = "操作";
    			t22 = space();
    			div12 = element("div");
    			if (if_block) if_block.c();
    			t23 = space();
    			div15 = element("div");
    			div13 = element("div");
    			input2 = element("input");
    			t24 = text("\n          全选");
    			t25 = space();
    			div14 = element("div");
    			p0 = element("p");
    			t26 = text("已选择\n            ");
    			span1 = element("span");
    			t27 = text(t27_value);
    			t28 = text("\n            件商品");
    			t29 = space();
    			p1 = element("p");
    			t30 = text("总价:\n            ");
    			span2 = element("span");
    			t31 = text("￥");
    			t32 = text(ctx.maney);
    			t33 = space();
    			button1 = element("button");
    			attr(header, "class", "header svelte-1rdm6uc");
    			add_location(header, file$1, 263, 2, 5099);
    			attr(img, "src", "http://misc.360buyimg.com/jdf/1.0.0/unit/global-header/5.0.0/i/jdlogo-201708-@1x.png");
    			attr(img, "alt", "");
    			attr(img, "class", "svelte-1rdm6uc");
    			add_location(img, file$1, 267, 8, 5212);
    			attr(h1, "class", "svelte-1rdm6uc");
    			add_location(h1, file$1, 270, 8, 5346);
    			attr(div0, "class", "logo svelte-1rdm6uc");
    			add_location(div0, file$1, 266, 6, 5185);
    			attr(input0, "type", "text");
    			attr(input0, "placeholder", "自营");
    			attr(input0, "class", "svelte-1rdm6uc");
    			add_location(input0, file$1, 274, 8, 5408);
    			attr(button0, "class", "svelte-1rdm6uc");
    			add_location(button0, file$1, 275, 8, 5455);
    			attr(div1, "class", "search svelte-1rdm6uc");
    			add_location(div1, file$1, 273, 6, 5379);
    			attr(div2, "class", "logo_search svelte-1rdm6uc");
    			add_location(div2, file$1, 265, 4, 5153);
    			attr(span0, "class", "svelte-1rdm6uc");
    			add_location(span0, file$1, 281, 8, 5559);
    			attr(h3, "class", "svelte-1rdm6uc");
    			add_location(h3, file$1, 279, 6, 5533);
    			attr(input1, "type", "checkbox");
    			input1.checked = ctx.$checkboxFlag;
    			attr(input1, "class", "svelte-1rdm6uc");
    			add_location(input1, file$1, 286, 12, 5684);
    			attr(div3, "class", "svelte-1rdm6uc");
    			add_location(div3, file$1, 285, 10, 5666);
    			attr(div4, "class", "tr1 svelte-1rdm6uc");
    			add_location(div4, file$1, 284, 8, 5638);
    			attr(div5, "class", "tr2 svelte-1rdm6uc");
    			add_location(div5, file$1, 293, 8, 5873);
    			attr(div6, "class", "trk svelte-1rdm6uc");
    			add_location(div6, file$1, 294, 8, 5907);
    			attr(div7, "class", "tr3 svelte-1rdm6uc");
    			add_location(div7, file$1, 295, 8, 5935);
    			attr(div8, "class", "tr4 svelte-1rdm6uc");
    			add_location(div8, file$1, 296, 8, 5969);
    			attr(div9, "class", "tr5 svelte-1rdm6uc");
    			add_location(div9, file$1, 297, 8, 6003);
    			attr(div10, "class", "tr6 svelte-1rdm6uc");
    			add_location(div10, file$1, 298, 8, 6037);
    			attr(div11, "class", "list_title svelte-1rdm6uc");
    			add_location(div11, file$1, 283, 6, 5605);
    			attr(div12, "class", "list_content svelte-1rdm6uc");
    			add_location(div12, file$1, 300, 6, 6082);
    			attr(input2, "type", "checkbox");
    			input2.checked = ctx.$checkboxFlag;
    			attr(input2, "class", "svelte-1rdm6uc");
    			add_location(input2, file$1, 318, 10, 6688);
    			attr(div13, "class", "checkbox svelte-1rdm6uc");
    			add_location(div13, file$1, 317, 8, 6655);
    			attr(span1, "class", "num svelte-1rdm6uc");
    			add_location(span1, file$1, 327, 12, 6916);
    			attr(p0, "class", "svelte-1rdm6uc");
    			add_location(p0, file$1, 325, 10, 6884);
    			attr(span2, "class", "totalled svelte-1rdm6uc");
    			add_location(span2, file$1, 332, 12, 7036);
    			attr(p1, "class", "svelte-1rdm6uc");
    			add_location(p1, file$1, 330, 10, 7004);
    			attr(button1, "class", "svelte-1rdm6uc");
    			add_location(button1, file$1, 334, 10, 7100);
    			attr(div14, "class", "buy_btn svelte-1rdm6uc");
    			add_location(div14, file$1, 324, 8, 6852);
    			attr(div15, "class", "shop_buy svelte-1rdm6uc");
    			add_location(div15, file$1, 316, 6, 6624);
    			attr(div16, "class", "list_head svelte-1rdm6uc");
    			add_location(div16, file$1, 278, 4, 5503);
    			attr(div17, "class", "content svelte-1rdm6uc");
    			add_location(div17, file$1, 264, 2, 5127);
    			attr(div18, "class", "wrap svelte-1rdm6uc");
    			add_location(div18, file$1, 262, 0, 5078);

    			dispose = [
    				listen(input1, "click", ctx.click_handler),
    				listen(input2, "click", ctx.click_handler_2)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div18, anchor);
    			append(div18, header);
    			append(div18, t0);
    			append(div18, div17);
    			append(div17, div2);
    			append(div2, div0);
    			append(div0, img);
    			append(div0, t1);
    			append(div0, h1);
    			append(div2, t3);
    			append(div2, div1);
    			append(div1, input0);
    			append(div1, t4);
    			append(div1, button0);
    			append(div17, t6);
    			append(div17, div16);
    			append(div16, h3);
    			append(h3, t7);
    			append(h3, span0);
    			append(span0, t8);
    			append(div16, t9);
    			append(div16, div11);
    			append(div11, div4);
    			append(div4, div3);
    			append(div3, input1);
    			append(div3, t10);
    			append(div11, t11);
    			append(div11, div5);
    			append(div11, t13);
    			append(div11, div6);
    			append(div11, t14);
    			append(div11, div7);
    			append(div11, t16);
    			append(div11, div8);
    			append(div11, t18);
    			append(div11, div9);
    			append(div11, t20);
    			append(div11, div10);
    			append(div16, t22);
    			append(div16, div12);
    			if (if_block) if_block.m(div12, null);
    			append(div16, t23);
    			append(div16, div15);
    			append(div15, div13);
    			append(div13, input2);
    			append(div13, t24);
    			append(div15, t25);
    			append(div15, div14);
    			append(div14, p0);
    			append(p0, t26);
    			append(p0, span1);
    			append(span1, t27);
    			append(p0, t28);
    			append(div14, t29);
    			append(div14, p1);
    			append(p1, t30);
    			append(p1, span2);
    			append(span2, t31);
    			append(span2, t32);
    			append(div14, t33);
    			append(div14, button1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.$data) && t8_value !== (t8_value = ctx.$data.length)) {
    				set_data(t8, t8_value);
    			}

    			if (!current || changed.$checkboxFlag) {
    				input1.checked = ctx.$checkboxFlag;
    			}

    			if (ctx.$data.length > 0) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div12, null);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}

    			if (!current || changed.$checkboxFlag) {
    				input2.checked = ctx.$checkboxFlag;
    			}

    			if ((!current || changed.$checkedList) && t27_value !== (t27_value = ctx.$checkedList.length)) {
    				set_data(t27, t27_value);
    			}

    			if (!current || changed.maney) {
    				set_data(t32, ctx.maney);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div18);
    			}

    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $data, $checkedList, $checkboxFlag;

    	

      let maney = 0.0;

      const res = getContext("listStore");

      const data = writable([]); validate_store(data, 'data'); subscribe($$self, data, $$value => { $data = $$value; $$invalidate('$data', $data); });
      const checkboxFlag = writable(false); validate_store(checkboxFlag, 'checkboxFlag'); subscribe($$self, checkboxFlag, $$value => { $checkboxFlag = $$value; $$invalidate('$checkboxFlag', $checkboxFlag); });
      const checkedList = writable([]); validate_store(checkedList, 'checkedList'); subscribe($$self, checkedList, $$value => { $checkedList = $$value; $$invalidate('$checkedList', $checkedList); });
      

      onMount(async function() {
        const list = await fetch("http://localhost:3000/getList");
        const listData = await list.json();
        data.set(listData);
      });
      function checkboxChange(event) {
        const flag = event.target.checked;
        checkboxFlag.set(flag);
        data.update(data => {
          $data.filter(item => {
            item.checkFlag = flag;
          });
          return data
        });

        checkboxFlagClick();
      }
      function inptClick(event) {
        const id = event.target.getAttribute("data-id") * 1;
        data.update(data => {
          data.filter(item => {
            if (item.id === id) {
              item.checkFlag = event.target.checked;
            }
          });
          return data;
        });
        checkboxFlagClick();
      }
      function checkboxFlagClick() {
        let trueList = $data.filter(item => {
          return item.checkFlag === true;
        });
        checkedList.set(trueList);
        $$invalidate('maney', maney = $checkedList.reduce((prev, curr) => {
          return prev + curr.count * curr.price;
        }, 0));
      }
      function countClick(event){
        const type=event.target.getAttribute('type');
        const dataId=event.target.getAttribute("data-id") * 1;
        type==="remove"?
        data.update(data => {
          data.filter(item => {
            if (item.id === dataId) {
              item.count>0?item.count--:item.count=0;
            }
          });
          return data;
        })
        :data.update(data => {
          data.filter(item => {
            if (item.id === dataId) {
              item.count++;
            }
          });
          return data;
        });
          checkboxFlagClick();
      }
      function removeClick(event){
        const removeId=event.target.getAttribute("remove-id")*1;
        let ind;
        for(var i=0;i<$data.length;i++){
          if($data[i].id===removeId){
            ind=i;
          }
        }
        data.update((data)=>{
          data.splice(ind,1);
          return data
        });
        checkboxFlagClick();
      }

    	function click_handler(event) {
    		return checkboxChange(event);
    	}

    	function click_handler_1(event) {
    		return inptClick(event);
    	}

    	function click_handler_2(event) {
    		return checkboxChange(event);
    	}

    	return {
    		maney,
    		data,
    		checkboxFlag,
    		checkedList,
    		checkboxChange,
    		inptClick,
    		countClick,
    		removeClick,
    		$data,
    		$checkedList,
    		$checkboxFlag,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
