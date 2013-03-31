var direction  = 1;
var bugs_map   = new Array();
var bugs       = new Array();
var total_bugs = 50;
var bugsY      = 40;
var bugsX      = 100;
var game       = false;
var bugsSpeedX = 1000/($('#screen').width()*0.05);
var bugsSpeedY = 1000/($('#screen').width()*0.005);
var checkInt;
var ship;
var shell;

// Object
function Unit(name, x, y, speedX, speedY) {
    this.type = 'unit';
    this.name = name;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedy = speedY;
    this.stoped = true;


    // Add unit to space
    this.add = function() {
        $('#screen').append('<div id="'+this.name+'" />');
        $('#' + this.name).css({
            top:  this.y +'px',
            left: this.x + 'px'
        });
        this.width  = $('#' + this.name).width();
        this.height = $('#' + this.name).height();
    };

    this.getX = function() {
        return $('#' + this.name).position().left;
    }

    this.getY = function() {
        return $('#' + this.name).position().top;
    }

    this.stop = function () {
        this.stoped = true;
        $('#' + this.name).stop();
    }

    this.destroy = function() {
        this.stop();
        $('#' + this.name).remove();
    }
}

// Bug Map object
function BugsMap(name, x, y, speedX, speedY, bugs) {
    this.type = 'bugs_map';
    this.name = name;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;
    this.direction = 1;

    this.add();
    this.width = 0;

    $('#' + this.name).addClass('bugs_map');

    // Move bugs row to the left border
    this.moveLeft = function() {
        var unit = this;
        this.stoped = false;
        $('#'+ this.name).animate({
            left: '0px'
        },
        speedX * $('#' + this.name).position().left,
        'linear',
        function(){
            unit.stop();
            unit.moveRight();
            unit.moveDown();
        });
    }

    // Move bugs row to the right border
    this.moveRight = function() {
        var unit = this;
        this.stoped = false;
        $('#'+ this.name).animate({
            left: $('#screen').width() - this.width + 'px'
        },
        speedX * ($('#screen').width() - $('#' + this.name).position().left - this.width),
        'linear',
        function(){
            unit.stop();
            unit.moveLeft();
            unit.moveDown();
        });
    }

    // Move bugs row to the bottom border
    this.moveDown = function() {
        var unit = this;
        $('#'+ this.name).animate({
            top: $('#screen').height()
        },
        speedY * ($('#screen').height() - $('#' + this.name).position().top - this.height),
        'linear');
    }
}
BugsMap.prototype = new Unit();

// Bug object
function Bug(name) {
    this.type = 'bug';
    this.name = name;
    this.x = 0;
    this.y = 0;
    this.parentId = bugs_map.length;

    this.add = function() {
        // Define new bug position
        this.x = 0
        if ($('#bugs_map'+ this.parentId +' .bug').length) {
            this.x =
                $('#bugs_map'+ this.parentId +' .bug:last-child').position().left +
                $('#bugs_map'+ this.parentId +' .bug:last-child').width() +
                30;
            this.y = 0;

            // New row bugs set
            if (this.x + bugsX*2 + $('#bugs_map'+ this.parentId +' .bug:last-child').width() > $('#screen').width()) {
                this.parentId += 1;
                bugs_map[this.parentId-1] = new BugsMap(
                    'bugs_map' + this.parentId,
                    bugsX,
                    $('.bugs_map:last-child').position().top + $('#bugs_map'+ (this.parentId-1) +' .bug:last-child').height() + 30,
                    // Используем скорость как задержку интервала для перемещения врага на 1 пиксель
                    bugsSpeedX,
                    bugsSpeedY
                );
                this.x = 0;
            }
        }

        $('#bugs_map' + this.parentId).append('<div id="'+this.name+'" class="bug" />');
        $('#' + this.name).css({
            top:  this.y +'px',
            left: this.x + 'px'
        });

        this.width  = $('#' + this.name).width();
        this.height = $('#' + this.name).height();
        bugs_map[this.parentId-1].height = this.height;
        bugs_map[this.parentId-1].width  += this.width  + 30;
    }

    this.add();

    // Координаты противника в ряду
    this.getX = function() {
        return $('#' + this.name).position().left +
            $('#bugs_map' + this.parentId).position().left;
    }

    this.getY = function() {
        return $('#' + this.name).position().top +
            $('#bugs_map' + this.parentId).position().top;
    }
}
Bug.prototype = new Unit();

// Ship object
function Ship(name, x, y, speedX) {
    this.type = 'ship';
    this.name = name;
    this.x = x;
    this.y = y;
    this.stoped = true;

    this.add();

    // Move ship to the left border
    this.moveLeft = function() {
        var unit = this;
        this.stoped = false;
        $('#'+ this.name).animate({
            left: '0px'
        },
        speedX * $('#' + this.name).position().left,
        'linear',
        function(){
            unit.stop();
        });
    }

    // Move ship to the right border
    this.moveRight = function() {
        var unit = this;
        this.stoped = false;
        $('#'+ this.name).animate({
            left: $('#screen').width() - this.width + 'px'
        },
        speedX * ($('#screen').width() - $('#' + this.name).position().left),
        'linear',
        function(){
            unit.stop();
        });
    }
}
Ship.prototype = new Unit();

// Shell object
function Shell(name, x, y, speedX, speedY) {
    this.type = 'shell';
    this.name = name;
    this.x = x;
    this.y = y;
    this.speedX = speedX;
    this.speedY = speedY;

    // Add shell on space press
    this.add();
    $('#' + this.name).addClass('shell');

    this.moveUp = function() {
        var unit = this;
        $('#' + this.name).animate({
            top: 0,
        },
        this.speedY * $('#screen').height(),
        'linear',
        function() {
            unit.stop();
            $(this).remove();
        });
    }
}
Shell.prototype = new Unit();

// Инициалищация новой игры - добавление противников
function initGame() {
    bugs_map = new Array();
    bugs     = new Array();

    bugs_map[0] = new BugsMap(
        'bugs_map1',
        bugsX,
        bugsY,
        bugsSpeedX,
        bugsSpeedY
    );

    // Добавить отряд врагов
    for (var i = 1; i <= total_bugs; i++) {
        bugs[i] = new Bug('bug' + i);
    }
}

// Старт игры - включить движение противника
function gameStart() {
    for(var i = 0; i <= bugs_map.length -1; i++) {
        bugs_map[i].moveLeft();
        bugs_map[i].moveDown();
    }
}

// Проигрыш
function gameOver() {
    alert("Game over!!!");
    for (var i = 1; i <= total_bugs; i++) {
        bugs[i].destroy();
    }

    for(var i = 0; i <= bugs_map.length -1; i++) {
        bugs_map[i].destroy();
    }

    bugsSpeedX = 1000/($('#screen').width()*0.05);
    bugsSpeedY = 1000/($('#screen').width()*0.005);
    clearInterval(checkInt);
}

// Проверить цель на попадание или штраф
function check() {
    $('.shell').each(function(){
        var target = $(document.elementFromPoint($(this).offset().left - 1, $(this).offset().top - 1));
        if (target.attr('class') == 'bug') {
            var i = target.attr('id').replace('bug', '');
            // Удалить пустой слой
            if ($('#bugs_map' + bugs[i].parentId + ' .bug').length - 1 == 0) {
                bugs_map[bugs[i].parentId - 1].destroy();
            }
            bugs[i].destroy();
            shell.destroy();

            // All bugs destroyed - Level Up & start new game
            if (!$('.bugs_map').length) {
                bugsSpeedX -= 0.5*bugsSpeedX;
                bugsSpeedY -= 0.5*bugsSpeedY;

                initGame();
                gameStart();
            }
        }
    });

    $('#ship').each(function(){
        // Ship left top edge
        var target1 = $(document.elementFromPoint($(this).offset().left + 1, $(this).offset().top - 1));
        // Ship left bottom edge
        var target2 = $(document.elementFromPoint($(this).offset().left + 1, $(this).offset().top + $(this).height() - 1));
        // Ship right bottom edge
        var target3 = $(document.elementFromPoint($(this).offset().left + $(this).width() - 1, $(this).offset().top + $(this).height() - 1));
        // Ship right top edge
        var target4 = $(document.elementFromPoint($(this).offset().left + $(this).width() - 1, $(this).offset().top + 1));
        if (target1.attr('class') == 'bug' ||
            target2.attr('class') == 'bug' ||
            target3.attr('class') == 'bug' ||
            target4.attr('class') == 'bug'
        ) {
            gameOver();
        }
    });

    // Проигрыш - противник достиг нижнего края
    $('.bugs_map').each(function(){
        if($(this).position().top == $('#screen').height()) {
            gameOver();
        }
    });
};

// Init game
(function($){
    $(document).ready(function() {
        // Добавить корабль в космос
        ship = new Ship(
            'ship',
            $('#screen').width()/2 - 15,
            $('#screen').height() - 50,
            1000/($('#screen').width()*0.2)
        );

        initGame();

        // TODO: добавить диалог для начала игры
        gameStart();
        checkInt = setInterval('check()', 5);

        $(document).on('keydown', function(e){
            switch (e.which) {
                case 37:
                    // Move ship to the left
                    if (ship.stoped) {
                        ship.moveLeft();
                    }
                    break;

                case 39:
                    // Move ship to the right
                    if (ship.stoped) {
                        ship.moveRight();
                    }
                    break;

                case 32:
                    // Shoot
                    if (!$('.shell').length) {
                        shell = new Shell(
                            'shell',
                            ship.getX() + 15,
                            ship.getY(),
                            0,
                            1000/($('#screen').height()*1)
                        );
                        shell.moveUp();
                    }
                    break;

                default:
                    break;
            }
        });

        $(document).on('keyup', function(e){
            switch (e.which) {
                case 37:
                    ship.stop();
                    $('#ship').stop();
                    break;

                case 39:
                    ship.stop();
                    $('#ship').stop();
                    break;

                default:
                    break;
            }
        });
    });
})(jQuery);
