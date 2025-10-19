#!/bin/bash

# 工贸报价小程序后端部署脚本
# 使用方法: ./deploy.sh [start|stop|restart|logs|status]

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
}

# 检查环境变量文件
check_env() {
    if [ ! -f .env ]; then
        log_warn ".env文件不存在"
        if [ -f .env.example ]; then
            log_info "从.env.example复制配置文件"
            cp .env.example .env
            log_warn "请编辑.env文件，填写正确的配置信息"
            exit 1
        else
            log_error "缺少.env配置文件"
            exit 1
        fi
    fi
}

# 启动服务
start() {
    log_info "启动服务..."
    check_docker
    check_env
    
    # 创建必要的目录
    mkdir -p uploads logs nginx/ssl
    
    # 构建并启动容器
    docker-compose up -d --build
    
    log_info "等待服务启动..."
    sleep 5
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_info "服务启动成功！"
        log_info "后端API: http://localhost:3000"
        log_info "健康检查: http://localhost:3000/health"
    else
        log_error "服务启动失败，请查看日志"
        docker-compose logs
        exit 1
    fi
}

# 停止服务
stop() {
    log_info "停止服务..."
    docker-compose down
    log_info "服务已停止"
}

# 重启服务
restart() {
    log_info "重启服务..."
    stop
    start
}

# 查看日志
logs() {
    docker-compose logs -f --tail=100
}

# 查看状态
status() {
    log_info "服务状态:"
    docker-compose ps
    
    echo ""
    log_info "资源使用:"
    docker stats --no-stream $(docker-compose ps -q)
}

# 更新服务
update() {
    log_info "更新服务..."
    git pull
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    log_info "服务更新完成"
}

# 备份数据
backup() {
    log_info "备份数据..."
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # 备份上传文件
    if [ -d "uploads" ]; then
        cp -r uploads "$BACKUP_DIR/"
        log_info "上传文件已备份到 $BACKUP_DIR/uploads"
    fi
    
    # 备份日志
    if [ -d "logs" ]; then
        cp -r logs "$BACKUP_DIR/"
        log_info "日志已备份到 $BACKUP_DIR/logs"
    fi
    
    log_info "备份完成: $BACKUP_DIR"
}

# 主函数
main() {
    case "${1:-}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        logs)
            logs
            ;;
        status)
            status
            ;;
        update)
            update
            ;;
        backup)
            backup
            ;;
        *)
            echo "使用方法: $0 {start|stop|restart|logs|status|update|backup}"
            echo ""
            echo "命令说明:"
            echo "  start   - 启动服务"
            echo "  stop    - 停止服务"
            echo "  restart - 重启服务"
            echo "  logs    - 查看日志"
            echo "  status  - 查看状态"
            echo "  update  - 更新服务"
            echo "  backup  - 备份数据"
            exit 1
            ;;
    esac
}

main "$@"

