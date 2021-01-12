import {PluginClass, PluginOptions, BasePlugin} from '../plugins/BasePlugin';
import {EC} from '../plugins/ec';
import {SVC} from '../plugins/svc';

export type UAPluginOptions = any[];
export type Plugin = BasePlugin & {[propName: string]: unknown};

export class Plugins {
    public static readonly DefaultPlugins: string[] = [EC.Id, SVC.Id];
    private registeredPluginsMap: Record<string, PluginClass> = {
        [EC.Id]: EC,
        [SVC.Id]: SVC,
    };
    private requiredPlugins: Record<string, BasePlugin> = {};

    require(name: string, option: PluginOptions): void {
        const pluginClass = this.registeredPluginsMap[name];
        if (!pluginClass) {
            throw new Error(
                `No plugin named "${name}" is currently registered. If you use a custom plugin, use 'provide' first.`
            );
        }
        this.requiredPlugins[name] = new pluginClass(option);
    }

    provide(name: string, plugin: PluginClass) {
        this.registeredPluginsMap[name] = plugin;
    }

    clearRequired(): void {
        this.requiredPlugins = {};
    }

    execute(name: string, fn: string, ...pluginOptions: UAPluginOptions) {
        const plugin = this.requiredPlugins[name] as Plugin;
        if (!plugin) {
            throw new Error(`The plugin "${name}" is not required. Check that you required it on initialization.`);
        }
        const actionFunction = plugin[fn];
        if (!actionFunction) {
            throw new Error(`The function "${fn}" does not exists on the plugin "${name}".`);
        }
        if (typeof actionFunction !== 'function') {
            throw new Error(`"${fn}" of the plugin "${name}" is not a function.`);
        }
        return actionFunction.apply(plugin, pluginOptions);
    }
}
