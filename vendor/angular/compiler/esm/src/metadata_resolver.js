goog.module('_angular$compiler$src$metadata__resolver');
var core_1 = goog.require('_angular$core');
var core_private_1 = goog.require('_angular$compiler$core__private');
var lang_1 = goog.require('_angular$compiler$src$facade$lang');
var collection_1 = goog.require('_angular$compiler$src$facade$collection');
var exceptions_1 = goog.require('_angular$compiler$src$facade$exceptions');
var cpl = goog.require('_angular$compiler$src$compile__metadata');
var directive_resolver_1 = goog.require('_angular$compiler$src$directive__resolver');
var pipe_resolver_1 = goog.require('_angular$compiler$src$pipe__resolver');
var view_resolver_1 = goog.require('_angular$compiler$src$view__resolver');
var directive_lifecycle_reflector_1 = goog.require('_angular$compiler$src$directive__lifecycle__reflector');
var util_1 = goog.require('_angular$compiler$src$util');
var assertions_1 = goog.require('_angular$compiler$src$assertions');
var url_resolver_1 = goog.require('_angular$compiler$src$url__resolver');
var core_private_2 = core_private_1;
class CompileMetadataResolver {
    /**
     * @param {?} _directiveResolver
     * @param {?} _pipeResolver
     * @param {?} _viewResolver
     * @param {?} _platformDirectives
     * @param {?} _platformPipes
     * @param {?=} _reflector
     */
    constructor(_directiveResolver, _pipeResolver, _viewResolver, _platformDirectives, _platformPipes, _reflector) {
        this._directiveResolver = _directiveResolver;
        this._pipeResolver = _pipeResolver;
        this._viewResolver = _viewResolver;
        this._platformDirectives = _platformDirectives;
        this._platformPipes = _platformPipes;
        this._directiveCache = new Map();
        this._pipeCache = new Map();
        this._anonymousTypes = new Map();
        this._anonymousTypeIndex = 0;
        if (lang_1.isPresent(_reflector)) {
            this._reflector = _reflector;
        }
        else {
            this._reflector = core_1.reflector;
        }
    }
    /**
     * @param {?} token
     * @return {?}
     */
    sanitizeTokenName(token) {
        let /** @type {?} */ identifier = lang_1.stringify(token);
        if (identifier.indexOf('(') >= 0) {
            // case: anonymous functions!
            let /** @type {?} */ found = this._anonymousTypes.get(token);
            if (lang_1.isBlank(found)) {
                this._anonymousTypes.set(token, this._anonymousTypeIndex++);
                found = this._anonymousTypes.get(token);
            }
            identifier = `anonymous_token_${found}_`;
        }
        return util_1.sanitizeIdentifier(identifier);
    }
    /**
     * @param {?} directiveType
     * @return {?}
     */
    getDirectiveMetadata(directiveType) {
        var /** @type {?} */ meta = this._directiveCache.get(directiveType);
        if (lang_1.isBlank(meta)) {
            var /** @type {?} */ dirMeta = this._directiveResolver.resolve(directiveType);
            var /** @type {?} */ templateMeta = null;
            var /** @type {?} */ changeDetectionStrategy = null;
            var /** @type {?} */ viewProviders = [];
            var /** @type {?} */ moduleUrl = staticTypeModuleUrl(directiveType);
            if (dirMeta instanceof core_1.ComponentMetadata) {
                assertions_1.assertArrayOfStrings('styles', dirMeta.styles);
                var /** @type {?} */ cmpMeta = (dirMeta);
                var /** @type {?} */ viewMeta = this._viewResolver.resolve(directiveType);
                assertions_1.assertArrayOfStrings('styles', viewMeta.styles);
                templateMeta = new cpl.CompileTemplateMetadata({
                    encapsulation: viewMeta.encapsulation,
                    template: viewMeta.template,
                    templateUrl: viewMeta.templateUrl,
                    styles: viewMeta.styles,
                    styleUrls: viewMeta.styleUrls
                });
                changeDetectionStrategy = cmpMeta.changeDetection;
                if (lang_1.isPresent(dirMeta.viewProviders)) {
                    viewProviders = this.getProvidersMetadata(dirMeta.viewProviders);
                }
                moduleUrl = componentModuleUrl(this._reflector, directiveType, cmpMeta);
            }
            var /** @type {?} */ providers = [];
            if (lang_1.isPresent(dirMeta.providers)) {
                providers = this.getProvidersMetadata(dirMeta.providers);
            }
            var /** @type {?} */ queries = [];
            var /** @type {?} */ viewQueries = [];
            if (lang_1.isPresent(dirMeta.queries)) {
                queries = this.getQueriesMetadata(dirMeta.queries, false);
                viewQueries = this.getQueriesMetadata(dirMeta.queries, true);
            }
            meta = cpl.CompileDirectiveMetadata.create({
                selector: dirMeta.selector,
                exportAs: dirMeta.exportAs,
                isComponent: lang_1.isPresent(templateMeta),
                type: this.getTypeMetadata(directiveType, moduleUrl),
                template: templateMeta,
                changeDetection: changeDetectionStrategy,
                inputs: dirMeta.inputs,
                outputs: dirMeta.outputs,
                host: dirMeta.host,
                lifecycleHooks: core_private_1.LIFECYCLE_HOOKS_VALUES.filter(hook => directive_lifecycle_reflector_1.hasLifecycleHook(hook, directiveType)),
                providers: providers,
                viewProviders: viewProviders,
                queries: queries,
                viewQueries: viewQueries
            });
            this._directiveCache.set(directiveType, meta);
        }
        return meta;
    }
    /**
     * @returns {cpl.CompileDirectiveMetadata} if possible, otherwise null.
     * @param {?} someType a symbol which may or may not be a directive type
     * @return {?}
     */
    maybeGetDirectiveMetadata(someType) {
        try {
            return this.getDirectiveMetadata(someType);
        }
        catch (e) {
            if (e.message.indexOf('No Directive annotation') !== -1) {
                return null;
            }
            throw e;
        }
    }
    /**
     * @param {?} type
     * @param {?} moduleUrl
     * @return {?}
     */
    getTypeMetadata(type, moduleUrl) {
        return new cpl.CompileTypeMetadata({
            name: this.sanitizeTokenName(type),
            moduleUrl: moduleUrl,
            runtime: type,
            diDeps: this.getDependenciesMetadata(type, null)
        });
    }
    /**
     * @param {?} factory
     * @param {?} moduleUrl
     * @return {?}
     */
    getFactoryMetadata(factory, moduleUrl) {
        return new cpl.CompileFactoryMetadata({
            name: this.sanitizeTokenName(factory),
            moduleUrl: moduleUrl,
            runtime: factory,
            diDeps: this.getDependenciesMetadata(factory, null)
        });
    }
    /**
     * @param {?} pipeType
     * @return {?}
     */
    getPipeMetadata(pipeType) {
        var /** @type {?} */ meta = this._pipeCache.get(pipeType);
        if (lang_1.isBlank(meta)) {
            var /** @type {?} */ pipeMeta = this._pipeResolver.resolve(pipeType);
            meta = new cpl.CompilePipeMetadata({
                type: this.getTypeMetadata(pipeType, staticTypeModuleUrl(pipeType)),
                name: pipeMeta.name,
                pure: pipeMeta.pure,
                lifecycleHooks: core_private_1.LIFECYCLE_HOOKS_VALUES.filter(hook => directive_lifecycle_reflector_1.hasLifecycleHook(hook, pipeType)),
            });
            this._pipeCache.set(pipeType, meta);
        }
        return meta;
    }
    /**
     * @param {?} component
     * @return {?}
     */
    getViewDirectivesMetadata(component) {
        var /** @type {?} */ view = this._viewResolver.resolve(component);
        var /** @type {?} */ directives = flattenDirectives(view, this._platformDirectives);
        for (var /** @type {?} */ i = 0; i < directives.length; i++) {
            if (!isValidType(directives[i])) {
                throw new exceptions_1.BaseException(`Unexpected directive value '${lang_1.stringify(directives[i])}' on the View of component '${lang_1.stringify(component)}'`);
            }
        }
        return directives.map(type => this.getDirectiveMetadata(type));
    }
    /**
     * @param {?} component
     * @return {?}
     */
    getViewPipesMetadata(component) {
        var /** @type {?} */ view = this._viewResolver.resolve(component);
        var /** @type {?} */ pipes = flattenPipes(view, this._platformPipes);
        for (var /** @type {?} */ i = 0; i < pipes.length; i++) {
            if (!isValidType(pipes[i])) {
                throw new exceptions_1.BaseException(`Unexpected piped value '${lang_1.stringify(pipes[i])}' on the View of component '${lang_1.stringify(component)}'`);
            }
        }
        return pipes.map(type => this.getPipeMetadata(type));
    }
    /**
     * @param {?} typeOrFunc
     * @param {?} dependencies
     * @return {?}
     */
    getDependenciesMetadata(typeOrFunc, dependencies) {
        let /** @type {?} */ params = lang_1.isPresent(dependencies) ? dependencies : this._reflector.parameters(typeOrFunc);
        if (lang_1.isBlank(params)) {
            params = [];
        }
        return params.map((param) => {
            if (lang_1.isBlank(param)) {
                return null;
            }
            let /** @type {?} */ isAttribute = false;
            let /** @type {?} */ isHost = false;
            let /** @type {?} */ isSelf = false;
            let /** @type {?} */ isSkipSelf = false;
            let /** @type {?} */ isOptional = false;
            let /** @type {?} */ query = null;
            let /** @type {?} */ viewQuery = null;
            var /** @type {?} */ token = null;
            if (lang_1.isArray(param)) {
                ((param))
                    .forEach((paramEntry) => {
                    if (paramEntry instanceof core_1.HostMetadata) {
                        isHost = true;
                    }
                    else if (paramEntry instanceof core_1.SelfMetadata) {
                        isSelf = true;
                    }
                    else if (paramEntry instanceof core_1.SkipSelfMetadata) {
                        isSkipSelf = true;
                    }
                    else if (paramEntry instanceof core_1.OptionalMetadata) {
                        isOptional = true;
                    }
                    else if (paramEntry instanceof core_1.AttributeMetadata) {
                        isAttribute = true;
                        token = paramEntry.attributeName;
                    }
                    else if (paramEntry instanceof core_1.QueryMetadata) {
                        if (paramEntry.isViewQuery) {
                            viewQuery = paramEntry;
                        }
                        else {
                            query = paramEntry;
                        }
                    }
                    else if (paramEntry instanceof core_1.InjectMetadata) {
                        token = paramEntry.token;
                    }
                    else if (isValidType(paramEntry) && lang_1.isBlank(token)) {
                        token = paramEntry;
                    }
                });
            }
            else {
                token = param;
            }
            if (lang_1.isBlank(token)) {
                return null;
            }
            return new cpl.CompileDiDependencyMetadata({
                isAttribute: isAttribute,
                isHost: isHost,
                isSelf: isSelf,
                isSkipSelf: isSkipSelf,
                isOptional: isOptional,
                query: lang_1.isPresent(query) ? this.getQueryMetadata(query, null) : null,
                viewQuery: lang_1.isPresent(viewQuery) ? this.getQueryMetadata(viewQuery, null) : null,
                token: this.getTokenMetadata(token)
            });
        });
    }
    /**
     * @param {?} token
     * @return {?}
     */
    getTokenMetadata(token) {
        token = core_1.resolveForwardRef(token);
        var /** @type {?} */ compileToken;
        if (lang_1.isString(token)) {
            compileToken = new cpl.CompileTokenMetadata({ value: token });
        }
        else {
            compileToken = new cpl.CompileTokenMetadata({
                identifier: new cpl.CompileIdentifierMetadata({
                    runtime: token,
                    name: this.sanitizeTokenName(token),
                    moduleUrl: staticTypeModuleUrl(token)
                })
            });
        }
        return compileToken;
    }
    /**
     * @param {?} providers
     * @return {?}
     */
    getProvidersMetadata(providers) {
        return providers.map((provider) => {
            provider = core_1.resolveForwardRef(provider);
            if (lang_1.isArray(provider)) {
                return this.getProvidersMetadata(provider);
            }
            else if (provider instanceof core_1.Provider) {
                return this.getProviderMetadata(provider);
            }
            else if (core_private_2.isProviderLiteral(provider)) {
                return this.getProviderMetadata(core_private_2.createProvider(provider));
            }
            else {
                return this.getTypeMetadata(provider, staticTypeModuleUrl(provider));
            }
        });
    }
    /**
     * @param {?} provider
     * @return {?}
     */
    getProviderMetadata(provider) {
        var /** @type {?} */ compileDeps;
        if (lang_1.isPresent(provider.useClass)) {
            compileDeps = this.getDependenciesMetadata(provider.useClass, provider.dependencies);
        }
        else if (lang_1.isPresent(provider.useFactory)) {
            compileDeps = this.getDependenciesMetadata(provider.useFactory, provider.dependencies);
        }
        return new cpl.CompileProviderMetadata({
            token: this.getTokenMetadata(provider.token),
            useClass: lang_1.isPresent(provider.useClass) ?
                this.getTypeMetadata(provider.useClass, staticTypeModuleUrl(provider.useClass)) :
                null,
            useValue: convertToCompileValue(provider.useValue),
            useFactory: lang_1.isPresent(provider.useFactory) ?
                this.getFactoryMetadata(provider.useFactory, staticTypeModuleUrl(provider.useFactory)) :
                null,
            useExisting: lang_1.isPresent(provider.useExisting) ? this.getTokenMetadata(provider.useExisting) :
                null,
            deps: compileDeps,
            multi: provider.multi
        });
    }
    /**
     * @param {?} queries
     * @param {?} isViewQuery
     * @return {?}
     */
    getQueriesMetadata(queries, isViewQuery) {
        var /** @type {?} */ compileQueries = [];
        collection_1.StringMapWrapper.forEach(queries, (query, propertyName) => {
            if (query.isViewQuery === isViewQuery) {
                compileQueries.push(this.getQueryMetadata(query, propertyName));
            }
        });
        return compileQueries;
    }
    /**
     * @param {?} q
     * @param {?} propertyName
     * @return {?}
     */
    getQueryMetadata(q, propertyName) {
        var /** @type {?} */ selectors;
        if (q.isVarBindingQuery) {
            selectors = q.varBindings.map(varName => this.getTokenMetadata(varName));
        }
        else {
            selectors = [this.getTokenMetadata(q.selector)];
        }
        return new cpl.CompileQueryMetadata({
            selectors: selectors,
            first: q.first,
            descendants: q.descendants,
            propertyName: propertyName,
            read: lang_1.isPresent(q.read) ? this.getTokenMetadata(q.read) : null
        });
    }
    static _tsickle_typeAnnotationsHelper() {
        /** @type {?} */
        CompileMetadataResolver.prototype._directiveCache;
        /** @type {?} */
        CompileMetadataResolver.prototype._pipeCache;
        /** @type {?} */
        CompileMetadataResolver.prototype._anonymousTypes;
        /** @type {?} */
        CompileMetadataResolver.prototype._anonymousTypeIndex;
        /** @type {?} */
        CompileMetadataResolver.prototype._reflector;
        /** @type {?} */
        CompileMetadataResolver.prototype._directiveResolver;
        /** @type {?} */
        CompileMetadataResolver.prototype._pipeResolver;
        /** @type {?} */
        CompileMetadataResolver.prototype._viewResolver;
        /** @type {?} */
        CompileMetadataResolver.prototype._platformDirectives;
        /** @type {?} */
        CompileMetadataResolver.prototype._platformPipes;
    }
}
CompileMetadataResolver.decorators = [
    { type: core_1.Injectable },
];
CompileMetadataResolver.ctorParameters = [
    { type: directive_resolver_1.DirectiveResolver, },
    { type: pipe_resolver_1.PipeResolver, },
    { type: view_resolver_1.ViewResolver, },
    { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: [core_1.PLATFORM_DIRECTIVES,] },] },
    { type: undefined, decorators: [{ type: core_1.Optional }, { type: core_1.Inject, args: [core_1.PLATFORM_PIPES,] },] },
    { type: core_private_1.ReflectorReader, },
];
exports.CompileMetadataResolver = CompileMetadataResolver;
/**
 * @param {?} view
 * @param {?} platformDirectives
 * @return {?}
 */
function flattenDirectives(view, platformDirectives) {
    let /** @type {?} */ directives = [];
    if (lang_1.isPresent(platformDirectives)) {
        flattenArray(platformDirectives, directives);
    }
    if (lang_1.isPresent(view.directives)) {
        flattenArray(view.directives, directives);
    }
    return directives;
}
/**
 * @param {?} view
 * @param {?} platformPipes
 * @return {?}
 */
function flattenPipes(view, platformPipes) {
    let /** @type {?} */ pipes = [];
    if (lang_1.isPresent(platformPipes)) {
        flattenArray(platformPipes, pipes);
    }
    if (lang_1.isPresent(view.pipes)) {
        flattenArray(view.pipes, pipes);
    }
    return pipes;
}
/**
 * @param {?} tree
 * @param {?} out
 * @return {?}
 */
function flattenArray(tree, out) {
    for (var /** @type {?} */ i = 0; i < tree.length; i++) {
        var /** @type {?} */ item = core_1.resolveForwardRef(tree[i]);
        if (lang_1.isArray(item)) {
            flattenArray(item, out);
        }
        else {
            out.push(item);
        }
    }
}
/**
 * @param {?} value
 * @return {?}
 */
function isStaticType(value) {
    return lang_1.isStringMap(value) && lang_1.isPresent(value['name']) && lang_1.isPresent(value['filePath']);
}
/**
 * @param {?} value
 * @return {?}
 */
function isValidType(value) {
    return isStaticType(value) || (value instanceof lang_1.Type);
}
/**
 * @param {?} value
 * @return {?}
 */
function staticTypeModuleUrl(value) {
    return isStaticType(value) ? value['filePath'] : null;
}
/**
 * @param {?} reflector
 * @param {?} type
 * @param {?} cmpMetadata
 * @return {?}
 */
function componentModuleUrl(reflector, type, cmpMetadata) {
    if (isStaticType(type)) {
        return staticTypeModuleUrl(type);
    }
    if (lang_1.isPresent(cmpMetadata.moduleId)) {
        var /** @type {?} */ moduleId = cmpMetadata.moduleId;
        var /** @type {?} */ scheme = url_resolver_1.getUrlScheme(moduleId);
        return lang_1.isPresent(scheme) && scheme.length > 0 ? moduleId :
            `package:${moduleId}${util_1.MODULE_SUFFIX}`;
    }
    return reflector.importUri(type);
}
/**
 * @param {?} value
 * @return {?}
 */
function convertToCompileValue(value) {
    return util_1.visitValue(value, new _CompileValueConverter(), null);
}
class _CompileValueConverter extends util_1.ValueTransformer {
    /**
     * @param {?} value
     * @param {?} context
     * @return {?}
     */
    visitOther(value, context) {
        if (isStaticType(value)) {
            return new cpl.CompileIdentifierMetadata({ name: value['name'], moduleUrl: staticTypeModuleUrl(value) });
        }
        else {
            return new cpl.CompileIdentifierMetadata({ runtime: value });
        }
    }
}
//# sourceMappingURL=metadata_resolver.js.map