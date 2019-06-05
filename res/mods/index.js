/**

 @Name: 达达问答入口

 */


layui.define(['layer', 'layedit', 'laytpl', 'layDate', 'form', 'element', 'upload', 'util'], function (exports) {

    let baseUrl = 'http://localhost:8080';
    let imgUrl = 'http://148.70.8.85/';
    layui.cache.token = JSON.parse(localStorage.getItem('token'));

    layui.imgUrl = function () {
        return imgUrl;
    };
    layui.baseUrl = function () {
        return baseUrl;
    };


    var $ = layui.jquery
        , layer = layui.layer
        , laytpl = layui.laytpl
        , form = layui.form
        , element = layui.element
        , upload = layui.upload
        , util = layui.util
        , laydate = layui.laydate
        , layedit = lay.layedit
        , device = layui.device()

        , DISABLED = 'layui-btn-disabled';

    //阻止IE7以下访问
    if (device.ie && device.ie < 8) {
        layer.alert('如果您非得使用 IE 浏览器访问达达问答，那么请使用 IE8+');
    }

    laydate.render({
        elem: '#L_birthday'
    });


    layui.focusInsert = function (obj, str) {
        var result, val = obj.value;
        obj.focus();
        if (document.selection) { //ie
            result = document.selection.createRange();
            document.selection.empty();
            result.text = str;
        } else {
            result = [val.substring(0, obj.selectionStart), str, val.substr(obj.selectionEnd)];
            obj.focus();
            obj.value = result.join('');
        }
    };


    //数字前置补零
    layui.laytpl.digit = function (num, length, end) {
        var str = '';
        num = String(num);
        length = length || 2;
        for (var i = num.length; i < length; i++) {
            str += '0';
        }
        return num < Math.pow(10, length) ? str + (num | 0) : num;
    };
    // ajax
    var fly = {
        //Ajax
        json: function (url, data, success, options, beforeAjax) {
            var that = this, type = typeof data === 'function';

            if (type) {
                options = success
                success = data;
                data = {};
            }

            options = options || {};


            return $.ajax({
                type: options.type || 'post',
                dataType: options.dataType || 'json',
                data: data,
                url: baseUrl + url,
                beforeSend: function (request) {
                    if (url !== '/userAccount/login') {
                        let nowUser = JSON.parse(localStorage.getItem('token'));
                        if (nowUser) {
                            nowUser.username = '';
                            request.setRequestHeader("Authorization", JSON.stringify(nowUser));
                        }
                    }

                    beforeAjax && beforeAjax(request);
                },
                success: function (res) {
                    if (res.body) {
                        success && success(res);
                    } else {
                        layer.msg(res.head.msg || res.head.stateCode, {shift: 6, icon: 5});
                        options.error && options.error();
                    }
                }, error: function (e) {
                    console.log(e)
                    layer.msg('请求异常，请重试', {shift: 6});
                    options.error && options.error(e);
                }
            });
        }

        //计算字符长度
        , charLen: function (val) {
            var arr = val.split(''), len = 0;
            for (var i = 0; i < val.length; i++) {
                arr[i].charCodeAt(0) < 299 ? len++ : len += 2;
            }
            return len;
        }

        , form: {}

        //简易编辑器
        , layEditor: function (options) {
            var html = ['<div class="layui-unselect fly-edit">'
                , '<span type="face" title="插入表情"><i class="iconfont icon-yxj-expression" style="top: 1px;"></i></span>'
                // , '<span type="picture" title="插入图片：img[src]"><i class="iconfont icon-tupian"></i></span>'
                , '<span type="href" title="超链接格式：a(href)[text]"><i class="iconfont icon-lianjie"></i></span>'
                , '<span type="code" title="插入代码或引用"><i class="iconfont icon-emwdaima" style="top: 1px;"></i></span>'
                , '<span type="hr" title="插入水平线">hr</span>'
                // , '<span type="yulan" title="预览"><i class="iconfont icon-yulan1"></i></span>'
                , '</div>'].join('');

            var log = {}, mod = {
                face: function (editor, self) { //插入表情
                    var str = '', ul, face = fly.faces;
                    for (var key in face) {
                        str += '<li title="' + key + '"><img src="' + face[key] + '"></li>';
                    }
                    str = '<ul id="LAY-editface" class="layui-clear">' + str + '</ul>';
                    layer.tips(str, self, {
                        tips: 3
                        , time: 0
                        , skin: 'layui-edit-face'
                    });
                    $(document).on('click', function () {
                        layer.closeAll('tips');
                    });
                    $('#LAY-editface li').on('click', function () {
                        var title = $(this).attr('title') + ' ';
                        layui.focusInsert(editor[0], 'face' + title);
                    });
                }
                , picture: function (editor) { //插入图片
                    layer.open({
                        type: 1
                        , id: 'fly-jie-upload'
                        , title: '插入图片'
                        , area: 'auto'
                        , shade: false
                        , area: '465px'
                        , fixed: false
                        , offset: [
                            editor.offset().top - $(window).scrollTop() + 'px'
                            , editor.offset().left + 'px'
                        ]
                        , skin: 'layui-layer-border'
                        , content: ['<ul class="layui-form layui-form-pane" style="margin: 20px;">'
                            , '<li class="layui-form-item">'
                            , '<label class="layui-form-label">URL</label>'
                            , '<div class="layui-input-inline">'
                            , '<input required name="image" placeholder="支持直接粘贴远程图片地址" value="" class="layui-input">'
                            , '</div>'
                            , '<button type="button" class="layui-btn layui-btn-primary" id="uploadImg"><i class="layui-icon">&#xe67c;</i>上传图片</button>'
                            , '</li>'
                            , '<li class="layui-form-item" style="text-align: center;">'
                            , '<button type="button" lay-submit lay-filter="uploadImages" class="layui-btn">确认</button>'
                            , '</li>'
                            , '</ul>'].join('')
                        , success: function (layero, index) {
                            var image = layero.find('input[name="image"]');

                            //执行上传实例
                            upload.render({
                                elem: '#uploadImg'
                                , url: '/api/upload/'
                                , size: 200
                                , done: function (res) {
                                    if (res.status == 0) {
                                        image.val(res.url);
                                    } else {
                                        layer.msg(res.msg, {icon: 5});
                                    }
                                }
                            });

                            form.on('submit(uploadImages)', function (data) {
                                var field = data.field;
                                if (!field.image) return image.focus();
                                layui.focusInsert(editor[0], 'img[' + field.image + '] ');
                                layer.close(index);
                            });
                        }
                    });
                }
                , href: function (editor) { //超链接
                    layer.prompt({
                        title: '请输入合法链接'
                        , shade: false
                        , fixed: false
                        , id: 'LAY_flyedit_href'
                        , offset: [
                            editor.offset().top - $(window).scrollTop() + 'px'
                            , editor.offset().left + 'px'
                        ]
                    }, function (val, index, elem) {
                        if (!/^http(s*):\/\/[\S]/.test(val)) {
                            layer.tips('这根本不是个链接，不要骗我。', elem, {tips: 1})
                            return;
                        }
                        layui.focusInsert(editor[0], ' a(' + val + ')[' + val + '] ');
                        layer.close(index);
                    });
                }
                , code: function (editor) { //插入代码
                    layer.prompt({
                        title: '请贴入代码或任意文本'
                        , formType: 2
                        , maxlength: 10000
                        , shade: false
                        , id: 'LAY_flyedit_code'
                        , area: ['800px', '360px']
                    }, function (val, index, elem) {
                        layui.focusInsert(editor[0], '[pre]\n' + val + '\n[/pre]');
                        layer.close(index);
                    });
                }
                , hr: function (editor) { //插入水平分割线
                    layui.focusInsert(editor[0], '[hr]');
                }
                , yulan: function (editor) { //预览
                    var content = editor.val();

                    content = /^\{html\}/.test(content)
                        ? content.replace(/^\{html\}/, '')
                        : fly.content(content);

                    layer.open({
                        type: 1
                        ,
                        title: '预览'
                        ,
                        shade: false
                        ,
                        area: ['100%', '100%']
                        ,
                        scrollbar: false
                        ,
                        content: '<div class="detail-body" style="margin:20px;">' + content + '</div>'
                    });
                }
            };

            layui.use('face', function (face) {
                options = options || {};
                fly.faces = face;
                $(options.elem).each(function (index) {
                    var that = this, othis = $(that), parent = othis.parent();
                    parent.prepend(html);
                    parent.find('.fly-edit span').on('click', function (event) {
                        var type = $(this).attr('type');
                        mod[type].call(that, othis, this);
                        if (type === 'face') {
                            event.stopPropagation()
                        }
                    });
                });
            });

        }

        , escape: function (html) {
            return String(html || '').replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
                .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
        }

        //内容转义
        , content: function (content) {
            //支持的html标签
            var html = function (end) {
                return new RegExp('\\n*\\[' + (end || '') + '(pre|hr|div|span|p|table|thead|th|tbody|tr|td|ul|li|ol|li|dl|dt|dd|h2|h3|h4|h5)([\\s\\S]*?)\\]\\n*', 'g');
            };
            content = fly.escape(content || '') //XSS
                .replace(/img\[([^\s]+?)\]/g, function (img) {  //转义图片
                    return '<img src="' + img.replace(/(^img\[)|(\]$)/g, '') + '">';
                }).replace(/@(\S+)(\s+?|$)/g, '@<a href="javascript:;" class="fly-aite">$1</a>$2') //转义@
                .replace(/face\[([^\s\[\]]+?)\]/g, function (face) {  //转义表情
                    var alt = face.replace(/^face/g, '');
                    return '<img alt="' + alt + '" title="' + alt + '" src="' + fly.faces[alt] + '">';
                }).replace(/a\([\s\S]+?\)\[[\s\S]*?\]/g, function (str) { //转义链接
                    var href = (str.match(/a\(([\s\S]+?)\)\[/) || [])[1];
                    var text = (str.match(/\)\[([\s\S]*?)\]/) || [])[1];
                    if (!href) return str;
                    var rel = /^(http(s)*:\/\/)\b(?!(\w+\.)*(sentsin.com|layui.com))\b/.test(href.replace(/\s/g, ''));
                    return '<a href="' + href + '" target="_blank"' + (rel ? ' rel="nofollow"' : '') + '>' + (text || href) + '</a>';
                }).replace(html(), '\<$1 $2\>').replace(html('/'), '\</$1\>') //转移HTML代码
                .replace(/\n/g, '<br>') //转义换行
            return content;
        }

        //新消息通知
        , newnotice: function () {
            let tip1 = $('#tip-header-wrapper');
            let tip2 = $('#tip-header-notice');
            let dot = $('<span class="layui-badge"></span>');
            let tip3 = $('#tip-left-notice');

            let user = window.localStorage.getItem('token');
            let noticeCount = window.localStorage.getItem('noticeCount');
            if (user && noticeCount) {
                if (parseInt(noticeCount) > 0) {
                    tip1.show();
                    tip2.show();
                    dot.text(parseInt(noticeCount));
                    tip3.append(dot);
                }
            }
            if (user) {
                fly.json('/message/notices/count', null, function (res) {
                    console.log(res);

                    if (res.body.data > 0) {
                        window.localStorage.setItem('noticeCount', res.body.data);
                        // 设置头导航
                        tip1.show();
                        // 设置头下导航
                        tip2.show();
                        // 左导航
                        let span = $('#not-read-span');
                        span.text('你有 ' + res.body.data + ' 条未读消息!');
                        tip3.empty();
                        dot.text(res.body.data);
                        tip3.append(dot);
                    } else {
                        window.localStorage.setItem('noticeCount', 0);
                    }
                }, {type: 'get'});

            }
        }
        // 设置右上角信息
        , setUserInfo: function () {
            if (!layui.cache.token) {
                return
            }
            console.log(layui.cache.token)
            // 设置头像
            $('cite.layui-hide-xs').text(layui.cache.token.username);
            // 设置nickname
            $('.fly-nav-avatar img').attr('src', layui.imgUrl() + layui.cache.token.avatar);
            // 设置上传头像
            $('.avatar-add img').attr('src', layui.imgUrl() + layui.cache.token.avatar);
            // 设置身份
            if (layui.cache.token.type === 0) {
                $('.fly-badge-vip').text('学生')
            }
            if (layui.cache.token.type === 1) {
                $('.fly-badge-vip').text('教师')
            }
            if (layui.cache.token.type === 2) {
                $('.fly-badge-vip').text('系统')
            }
        }
        // 设置浏览记录
        , setHistory: function (problemId) {
            if (problemId) {
                if (layui.cache.token) {
                    fly.json('/problemInfo/problem/history', {
                        problemId: problemId
                    }, function (res) {

                    })
                }

            }
        }

    };

    //设置个人信息
    fly.setUserInfo();

    $('#my-putproblem').on('click', function () {
        if (!layui.cache.token) {
            layer.msg('请登录！', {shift: 6});
            return
        }
        location.href = '/dadaWebMaster/dadaWeb/html/user/index.html';
    });
    $('#my-colproblem').on('click', function () {
        if (!layui.cache.token) {
            layer.msg('请登录！', {shift: 6});
            return
        }
        location.href = '/dadaWebMaster/dadaWeb/html/user/index.html#asd';

    });
    // 退出
    $('#tuichu').on('click', function () {
        window.localStorage.removeItem('token');
        location.href = '/dadaWebMaster/dadaWeb/html/user/login.html';
    });

    //搜索
    $('.fly-search').on('click', function () {
        layer.open({
            type: 1
            , title: false
            , closeBtn: false
            //,shade: [0.1, '#fff']
            , shadeClose: true
            , maxWidth: 10000
            , skin: 'fly-layer-search'
            , content: ['<form action="http://cn.bing.com/search" target="_blank">'
                , '<input autocomplete="off" placeholder="搜索内容，回车跳转" type="text" name="q">'
                , '</form>'].join('')
            , success: function (layero) {
                var input = layero.find('input');
                input.focus();

                layero.find('form').submit(function () {
                    var val = input.val();
                    if (val.replace(/\s/g, '') === '') {
                        return false;
                    }
                    input.val(input.val());
                });
            }
        })
    });

    //新消息通知
    fly.newnotice();

    //点击@
    $('body').on('click', '.fly-aite', function () {
        var othis = $(this), text = othis.text();
        if (othis.attr('href') !== 'javascript:;') {
            return;
        }
        text = text.replace(/^@|（[\s\S]+?）/g, '');
        othis.attr({
            href: '/jump?username=' + text
            , target: '_blank'
        });
    });

    // 注册
    form.on('submit(reg)', function (data) {
        let action = $(data.form).attr('action');
        console.log(action)
        fly.json(action, data.field, function (res) {
            if (res.body.data) {
                localStorage.setItem('token', JSON.stringify(res.body.data));
                layer.msg('注册成功！', {icon: 1});
                setTimeout(function () {
                    location.href = 'login.html'
                }, 2000)

            } else {
                layer.msg(res.head.msg, {icon: 2});
            }
        });
        return false;
    });
    // 登入
    form.on('submit(login)', function (data) {
        let action = $(data.form).attr('action');
        fly.json(action, data.field, function (res) {
            console.log(res)

            if (res.head.stateCode === 200) {
                if (res.body.data) {
                    localStorage.setItem('token', JSON.stringify(res.body.data));
                    localStorage.setItem('username', data.field.username);
                    localStorage.setItem('password', data.field.password);
                    location.href = 'set.html';
                } else {
                    layer.msg('登录失败', {icon: 2});
                }
            } else {
                layer.msg(res.head.msg, {icon: 2});
            }
        });
        return false;
    });
    //忘记密码
    form.on('submit(forget)', function (data) {
        let action = $(data.form).attr('action');
        fly.json(action, data.field, function (res) {
            if (res.head.stateCode === 200) {
                layer.msg('修改成功!', {icon: 1});
                localStorage.setItem('token', JSON.stringify(res.body.data));
                setTimeout(function () {
                    location.href = 'login.html';
                }, 2000)

            } else {
                layer.msg(res.head.msg, {icon: 2});
            }
        })
        return false
    });
    // 修改密码
    form.on('submit(changePass)', function (data) {
        let action = $(data.form).attr('action');
        fly.json(action, data.field, function (res) {
            if (res.head.stateCode === 200) {
                layer.msg('修改成功!', {icon: 1});
                localStorage.setItem('token', JSON.stringify(res.body.data));
            } else {
                layer.msg(res.head.msg, {icon: 2});
            }
        });
        return false;
    });
    // 修改个人信息
    form.on('submit(updateUserInfo)', function (data) {
        data.field.accountId = JSON.parse(localStorage.getItem('token')).id;

        if (data.field.userInfoId) {
            data.field.id = data.field.userInfoId;
        }
        console.log(data.field);

        $.ajax({
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(data.field),
            url: baseUrl + '/myPage/user/userInformation',
            beforeSend: function (request) {
                request.setRequestHeader('Content-Type', "application/json;charset=UTF-8");
            },
            success: function (res) {
                console.log(res);
                if (res.head.stateCode === 200) {
                    layer.msg('修改成功!', {icon: 1});
                } else {
                    layer.msg('修改失败!', {icon: 2});
                }

            }, error: function (e) {
                console.log(e)
                layer.msg('请求异常，请重试', {shift: 6});
            }
        });

        return false;
    });
    // 问题信息
    form.on('submit(problem)', function (data) {
        let action = $(data.form).attr('action'), button = $(data.elem);
        fly.json('/control/problem/info', data.field, function (res) {
            console.log(res);
            if (res.body.data) {
                window.localStorage.setItem('answerProblem', JSON.stringify(res.body.data));
                location.href = 'problem.html';
            } else {
                layer.msg(res.head.msg, {icon: 2});
            }

        });
        return false;
    });

    //表单提交
    form.on('submit(*)', function (data) {
        var action = $(data.form).attr('action'), button = $(data.elem);
        fly.json(action, data.field, function (res) {
            var end = function () {
                if (res.action) {
                    location.href = res.action;
                } else {
                    fly.form[action || button.attr('key')](data.field, data.form);
                }
            };
            if (res.head.stateCode === 200) {
                button.attr('alert') ? layer.alert(res.msg, {
                    icon: 1,
                    time: 10 * 1000,
                    end: end
                }) : end();
            }
            ;
        });
        return false;
    });


    //加载特定模块
    if (layui.cache.page && layui.cache.page !== 'index') {
        var extend = {};
        extend[layui.cache.page] = layui.cache.page;
        layui.extend(extend);
        layui.use(layui.cache.page);
    }
    //加载编辑器
    // fly.layEditor({
    //     elem: '.fly-editor'
    // });


    //手机设备的简单适配
    var treeMobile = $('.site-tree-mobile')
        , shadeMobile = $('.site-mobile-shade')

    treeMobile.on('click', function () {
        $('body').addClass('site-mobile');
    });

    shadeMobile.on('click', function () {
        $('body').removeClass('site-mobile');
    });

    $('.put-newProblem').on('click', function () {
        if (!layui.cache.token) {
            layer.msg('请登录！', {shift: 6});
            return
        }
        window.location.href = '/dadaWebMaster/dadaWeb/html/jie/add.html'
    })


    //固定Bar
    util.fixbar({
        bar1: '&#xe642;'
        , bgcolor: '#009688'
        , click: function (type) {
            if (!layui.cache.token) {
                layer.msg('请登录', {shift: 6});
                return
            }
            if (type === 'bar1') {
                // layer.msg('打开 index.js，开启发表新帖的路径');
                location.href = '/dadaWebMaster/dadaWeb/html/jie/add.html';
            }
        }
    });


    layui.cache.problemType = JSON.parse(window.localStorage.getItem('category'));
    if (!layui.cache.problemType) {
        getProblemType()
    }
    console.log(layui.cache.problemType);

    function getProblemType() {
        fly.json('/problemManager/problemType', null, function (res) {
            layui.cache.problemType = res.body.data;
            window.localStorage.setItem('category', JSON.stringify(layui.cache.problemType))
        }, {type: 'get'})
    }

    exports('fly', fly);

});

