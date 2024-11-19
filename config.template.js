module.exports = {
	slices: [
		{
			rootPath: '/var/projects/kh',
            // modelsPath: path.join('back', 'lib', 'Model', 'oltp'),
            // modelAclsPath: path.join('back', 'lib', 'Model', 'acls'),
            // controllersPath: path.join('back', 'lib', 'Content'),
            // frontHtmlPath: path.join('front', 'root', '_', 'app', 'html'),
            // frontDataPath: path.join('front', 'root', '_', 'app', 'js', 'data'),
            // frontViewPath: path.join('front', 'root', '_', 'app', 'js', 'view'),
		},
		{
			// Эта строка раскрывается в список подпапок; используется пакет https://github.com/isaacs/node-glob
			rootPathPattern: '/var/projects/kh/slices/*',
			// Здесь можно задать опции, которые будут копироваться во все раскрытые из `rootPathPattern` конфиги слайсов
		},
	],
}
