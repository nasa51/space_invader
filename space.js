// Переменные для хранения объектов игры
var bugs_map     = new Array();
var bugs         = new Array();
var ship;
var shell;

var gameover     = false;

var FPS           = 40;
var TOTAL_BUGS    = 25;
var LEVEL         = 1;

// Начальные координаты жуков
var BUGS_Y        = 40;
var BUGS_X        = 240;
var BUGS_MARGIN   = 30;

// Задание скоростей (px/ms)
var BUGS_SPEED_X  = ($('#screen').width()*0.05)/1000;      // Скорость движения жука по горизонтали (5% ширины экрана в секуду)
var BUGS_SPEED_Y  = ($('#screen').height()*0.005)/1000;    // Скорость движения жука по вертикали (0.5% высоты экрана в секуду)
var SHELL_SPEED   = ($('#screen').height()*1)/1000;        // Скорость движения снаряда (высота экрана в секуду)
var SHIP_SPEED    = ($('#screen').height()*0.2)/1000;      // Скорость движения корабля (20% ширины экрана в секуду)

// Oчки
var score = 0;

// Родительский объект игры
function Unit(name, x, y, speedX, speedY) {
    this.type = 'unit';
    this.name = name;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
    this.destroyed = false;
    this.stoped = true;

    // Добавить объект в игру
    this.add = function() {
        $('#screen').append('<div id="'+this.name+'" />');
        $('#' + this.name).css({
            top:  this.y +'px',
            left: this.x + 'px'
        });
        this.width  = $('#' + this.name).width();
        this.height = $('#' + this.name).height();
    };

    // Текущая координата объекта по горизонтали
    this.getX = function() {
        return $('#' + this.name).position().left;
    }

    // Текущая координата объекта по вертикали
    this.getY = function() {
        return $('#' + this.name).position().top;
    }

    // Движение объекта влево
    this.moveLeft = function() {
    }

    // Движение объекта вправо
    this.moveRight = function() {
    }

    // Движение объекта вверх
    this.moveUp = function() {
    }

    // Движение объекта вниз
    this.moveDown = function() {
    }

    // Остановка движения объекта
    this.stop = function () {
        this.stoped  = true;
        $('#' + this.name).stop();
    }

    // Проверка на существование
    this.isset = function() {
      return $('#' + this.name).length;
    }

    // Уничтожить объект
    this.destroy = function() {
        if (!gameover){
            // Эффект уничтожения жука
            switch (this.type) {
                case 'bug':
                    $('#' + this.name).addClass('bang').fadeOut('fast', function(){
                        $(this).stop();
                        $(this).remove();
                        // Все жуки убиты - переход на новый уровень
                        if (!$('.bug').length) {
                            bugs_map.destroy();
                            LEVEL++;
                            initGame();
                            gameStart();
                        }
                    });
                    break;

                default:
                    this.stop();
                    $('#' + this.name).remove();
                    break
            }
        } else {
            // Удаление объектов после проигрыша
            this.stop();
            $('#' + this.name).remove();
        }

        this.destroyed = true;
    }
}

// Ряд жуков (чтобы можно было задать разные направления движения рядов)
function BugsMap(name, x, y, speedX, speedY, bugs) {
    this.type = 'bugs_map';
    this.name = name;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
    this.direction = 1;

    this.add();

    $('#' + this.name).addClass('bugs_map');

    // Движения ряда жуков влево
    this.moveLeft = function() {
        if (!this.isset()) {
            return;
        }
        var unit = this;
        this.stoped = false;
        $('#'+ this.name).animate({
            left: '0px'
        }, {
            // Время движения ряда до левого края экрана
            duration:  $('#' + this.name).position().left / this.speedX,
            easing: 'linear',
            // Проверка достижения цели на каждо шагу анимации
            step: function(currentLeft) {
                unit.check();
            },
            // Изменить направление в конце анимации
            complete: function() {
                $(this).stop();
                unit.moveRight();
                unit.moveDown();
            }
        });
    }

    // Move bugs row to the right border
    this.moveRight = function() {
        if (!this.isset()) {
            return;
        }
        var unit = this;
        this.stoped = false;
        $('#'+ this.name).animate({
            left: $('#screen').width() - this.width + 'px'
        }, {
            // Время движения ряда до правого края экрана
            duration:  ($('#screen').width() - $('#' + this.name).position().left - this.width) / this.speedX,
            easing: 'linear',
            // Проверка достижения цели на каждо шагу анимации
            step: function(currentLeft) {
                unit.check();
            },
            // Изменить направление в конце анимации
            complete: function() {
                $(this).stop();
                unit.moveLeft();
                unit.moveDown();
            }
        });
    }

    // Движение ряда вниз
    this.moveDown = function() {
        if (!this.isset()) {
            return;
        }
        var unit = this;
        $('#'+ this.name).animate({
            top: $('#screen').height()
        }, {
            duration: ($('#screen').height() - $('#' + this.name).position().top - this.height) / this.speedY,
            easing: 'linear',
            // Проверка достижения цели на каждо шагу анимации
            step: function(currentLeft) {
                unit.check();
            }
        });
    }

    this.check = function() {
        var unit = this;
        // Проигрыш - жук попал по кораблю
        $('#ship').collision('.bug').each(function() {
            gameOver();
        });

        // Проигрыш - противник достиг нижнего края
        $('.bugs_map').each(function(){
            if($(this).position().top == $('#screen').height()) {
                gameOver();
            }
        });
    }
}
BugsMap.prototype = new Unit();

// Объект Жук
function Bug(name) {
    this.type = 'bug';
    this.name = name;
    this.x = 0;
    this.y = 0;

    this.add = function() {
        // Определение новой позиции жука в родительском слое
        this.x = 0
        if ($('#bugs_map .bug').length) {
            this.x =
                $('#bugs_map .bug:last-child').position().left +
                $('#bugs_map .bug:last-child').width() +
                BUGS_MARGIN;
            this.y = $('#bugs_map .bug:last-child').position().top;

            // Создание нового ряда жуков
            if (this.x + BUGS_X*2 + $('#bugs_map .bug:last-child').width() > $('#screen').width()) {
                this.x = 0;
                this.y =
                  $('#bugs_map .bug:last-child').position().top +
                  $('#bugs_map .bug:last-child').height() +
                  BUGS_MARGIN;
            }
        }

        // Добавить жука в ряд
        $('#bugs_map').append('<div id="'+this.name+'" class="bug" />');
        $('#' + this.name).css({
            top:  this.y +'px',
            left: this.x + 'px'
        });

        this.width  = $('#' + this.name).width();
        this.height = $('#' + this.name).height();

        // Актуализировать размеры ряда жуквов
        if (!bugs_map.height) {
            var bugs_row = parseInt(($('#screen').width() - 2 * BUGS_X)/(this.width + BUGS_MARGIN));
            bugs_map.width  = bugs_row * (this.width + BUGS_MARGIN) - BUGS_MARGIN;
            bugs_map.height = Math.round(TOTAL_BUGS / bugs_row);
        }

    }

    this.add();

    // Координаты жука в ряду
    this.getX = function() {
        return $('#' + this.name).position().left +
            $('#bugs_map').position().left;
    }
    this.getY = function() {
        return $('#' + this.name).position().top +
            $('#bugs_map').position().top;
    }
}
Bug.prototype = new Unit();

// Объект Корабль
function Ship(name, x, y, speedX) {
    this.type = 'ship';
    this.name = name;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.stoped = true;

    this.add();
    $('#score').text('Score: ' + score);

    // Движение корабля влево
    this.moveLeft = function() {
        if (!this.isset()) {
            return;
        }
        var unit = this;
        this.stoped = false;
        $('#'+ this.name).animate({
            left: '0px'
        }, {
            duration: $('#' + this.name).position().left / this.speedX,
            easing: 'linear',
            complete: function(){
                unit.stop();
            }
        });
    }

    // Движение корабля вправо
    this.moveRight = function() {
        if (!this.isset()) {
            return;
        }
        var unit = this;
        this.stoped = false;
        $('#'+ this.name).animate({
            left: $('#screen').width() - unit.width + 'px'
        }, {
            duration: ($('#screen').width() - $('#' + this.name).position().left) / this.speedX,
            easing: 'linear',
            complete: function() {
                unit.stop();
            }
        });
    }
}
Ship.prototype = new Unit();

// Объект снаряд
function Shell(name, x, y, speedX, speedY) {
    this.type = 'shell';
    this.name = name;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;

    this.add();

    $('#' + this.name).addClass('shell');

    this.moveUp = function() {
        var unit = this;
        $('#' + this.name).animate({
            top: 0,
        }, {
            duration: $('#screen').height() / this.speedY,
            easing: 'linear',
            // Проверка на попадание на каждом шагу анимации
            step: function(currentLeft) {
                unit.check();
            },
            complete: function() {
                unit.stop();
                $(this).remove();
            }
        });
    }

    // Проверка на попaдание
    this.check = function() {
        var unit = this;
        // Проверить наличие противника в зоне поражения снаряда
        $('#'  + unit.name).collision('.bug').each(function() {
            var i = $(this).attr('id').replace('bug', '');
            bugs[i].destroy();
            unit.destroy();

            score += LEVEL;
            $('#score').text('Score: ' + score);

        });
    }
}
Shell.prototype = new Unit();

// Инициализация новой игры - добавление противников
function initGame() {
    $('#level').text('Level: ' + LEVEL);
    bugs     = new Array();

    bugs_map = new BugsMap(
        'bugs_map',
        BUGS_X,
        BUGS_Y,
        // Увеличим скорость на 50% при переходе на новый уровень
        BUGS_SPEED_X * ((LEVEL + 1)/2),
        BUGS_SPEED_Y * ((LEVEL + 1)/2)
    );

    // Добавить отряд врагов
    for (var i = 1; i <= TOTAL_BUGS; i++) {
        bugs[i] = new Bug('bug' + i);
    }
}

// Старт игры - включить движение жуков
function gameStart() {
    gameover = false;
    bugs_map.moveLeft();
    bugs_map.moveDown();
}

// Проигрыш
function gameOver() {
    gameover = true;
    LEVEL = 1;
    score = 0;

    // Показать обложку проигрыша
    $('#start').addClass('gameover');
    $('#start').show();

    // удалить все объекты с экрана
    for (var i = 1; i <= TOTAL_BUGS; i++) {
        bugs[i].destroy();
    }
    bugs_map.destroy();
    ship.destroy();
}

(function($){
    // Задаём интервал анимации jQuery
    $.fx.interval = FPS;

    $(document).ready(function() {
        // Показать обложку игры
        $('#start').bind('click', function(){
            $(this).hide();

            // Добавить корабль в космос
            ship = new Ship(
                'ship',
                $('#screen').width()/2 - 15,
                $('#screen').height() - 30,
                SHIP_SPEED
            );

            initGame();
            gameStart();

            // Управление кораблём и стрельба
            $(document).bind('keydown', function(e){
                switch (e.which) {
                    case 37:
                        // Движение корабля влево
                        // если корабль не движется
                        if (ship.stoped) {
                            ship.moveLeft();
                        }
                        break;

                    case 39:
                        // Движение корабля вправо
                        // если корабль не движется
                        if (ship.stoped) {
                            ship.moveRight();
                        }
                        break;

                    case 32:
                        // Выстрел
                        if (!$('.shell').length) {
                            shell = new Shell(
                                'shell',
                                ship.getX() + 15,
                                ship.getY(),
                                0,
                                SHELL_SPEED
                            );
                            shell.moveUp();
                        }
                        return false;
                        break;

                    default:
                        break;
                }
            });

            // остановить корабль
            $(document).bind('keyup', function(e){
                switch (e.which) {
                    case 37:
                        ship.stop();
                        break;

                    case 39:
                        ship.stop();
                        break;

                    default:
                        break;
                }
            });

            return false;
        });
    });
})(jQuery);
