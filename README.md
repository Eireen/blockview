
Parses scripts written in the [elu.js block](https://github.com/do-/elu.js/wiki/show_block) paradigm and allows you to find the call stack of a given block or `$_DO` function.


## When do I need this?

When you have a modified frontend block code, but you don't know which URL to test it on.

This script will output trees of blocks that call your changed block (or function). This way you can see the chain of calls to your block and find the affected page faster.

There are also plans to extract human readable names of blocks and buttons to which `$_DO` handlers are attached.


## How to use

```sh
git clone <this repo>
cd blockview
npm ci
cp config.template.js config.js
# Edit config.js

# Search by block name
./bin/blockview.js --call-stack-for  block_name  > output.js

# Search by $_DO handler name
./bin/blockview.js --call-stack-for  \$_DO.create_tb_md_subscribers  > output.js
```


## Examples of output

### Example of search by block name

```js
// ./bin/blockview.js --call-stack-for  tb_md_node_md_popup  > output.js
;([
    {
        "handlerName": "$_DRAW.tb_md_node_md_popup",
        "callers": [
            {
                "handlerName": "$_DO.create_md_id_voc_md_kind_10_tb_md_node"
            },
            {
                "handlerName": "$_DO.create_md_id_voc_md_kind_20_tb_md_node"
            },
            {
                "handlerName": "$_DO.open_metering_device_tb_md_node_md",
                "callers": [
                    {
                        "handlerName": "$_DRAW.tb_md_node_md",
                        "callers": [
                            {
                                "handlerName": "$_DRAW.tb_md_node"
                            }
                        ]
                    }
                ]
            }
        ]
    }
]);
```


### Example of search by $_DO handler name

```js
// ./bin/blockview.js --call-stack-for  \$_DO.create_tb_md_subscribers  > output.js
;([
    {
        "handlerName": "$_DO.create_tb_md_subscribers",
        "callers": [
            {
                "handlerName": "$_DO.create_subscriber_tb_metering_device"
            },
            {
                "handlerName": "$_DO.create_subscriber_form_tb_metering_device"
            },
            {
                "handlerName": "$_DO.create_subscriber_current_tb_metering_device"
            },
            {
                "handlerName": "$_DO.create_subscriber_other_tb_metering_device"
            }
        ]
    }
]);
```

