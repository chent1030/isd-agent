import socket
import time


SERVER_IP = '10.134.231.111'
SERVER_PORT = 10123


PROTOCOL_HEADER = [0x73, 0x74, 0x61, 0x72]
PROTOCOL_FOOTER = [0x65, 0x6E, 0x64, 0x6F]
CMD_OPEN_SINGLE_LOCK = 0x9A # 开单个锁
CMD_OPEN_ALL_LOCKS = 0xA0 # 开所有锁


def calculate_bcc(data_list):
    """
    计算BCC检验和(异或校验)
    """
    checksum = 0
    for byte in data_list:
        checksum ^= byte
    return checksum


def build_command(cmd_code, board_addr, lock_num_or_data):
    """
    构建命令数据包
    """
    if cmd_code == CMD_OPEN_SINGLE_LOCK:
        payload = [cmd_code, board_addr, lock_num_or_data, 0x11]
    elif cmd_code == CMD_OPEN_ALL_LOCKS:
        payload = [cmd_code, board_addr]
    else:
        if isinstance(lock_num_or_data, list):
            payload = [cmd_code, board_addr] + lock_num_or_data
        else:
            payload = [cmd_code, board_addr, lock_num_or_data]
    bcc = calculate_bcc(payload)
    full_command = PROTOCOL_HEADER + payload + [bcc] + PROTOCOL_FOOTER
    return bytearray(full_command)


def send_commane_and_receive_response(tcp_socket, command_bytes):
    """
    发送命令并接收响应
    """
    tcp_socket.sendall(command_bytes)
    response = tcp_socket.recv(1024)  # 接收响应数据
    return response


def open_single_lock_tcp(server_id, server_port, board_address, lock_number):
    """
    打开单个锁
    """
    command = build_command(CMD_OPEN_SINGLE_LOCK, board_address, lock_number)
    cmd_hex_str = " ".join(f"{byte:02X}" for byte in command)
    print(f"发送命令: {cmd_hex_str}")

    socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    socket.settimeout(3)  # 设置超时时间
    try:
        socket.connect((server_id, server_port))
        response = send_commane_and_receive_response(socket, command)
        if response:
            response_hex_str = " ".join(f"{byte:02X}" for byte in response)
            print(f"收到响应: {response_hex_str}")

            # 解析响应数据
            if (len(response) >= 10 and 
                response[:4] == PROTOCOL_HEADER and 
                response[4] == CMD_OPEN_SINGLE_LOCK and 
                response[5] == board_address and 
                response[6] == lock_number):
                status_byte = response[7]
                if status_byte == 0x00:
                    print(f">> 锁控版 {board_address} 的锁 {lock_number} 状态：关门（接触开关导通）")
                elif status_byte == 0x11:
                    print(f">> 锁控版 {board_address} 的锁 {lock_number} 状态：开门（接触开关断开）")
                else:
                    print(f">> 接收到未知状态字节：{status_byte:02X}")
            else:
                print("收到的响应格式不正确或与请求不匹配")
        else:
            print("未收到响应")
    except socket.timeout:
        print("连接超时，未收到响应")
    except Exception as e:
        print(f"发生错误: {e}")
    finally:
        socket.close()


def open_all_locks_tcp(server_id, server_port, board_address):
    """
    打开所有锁
    """
    command = build_command(CMD_OPEN_ALL_LOCKS, board_address, [])
    cmd_hex_str = " ".join(f"{byte:02X}" for byte in command)
    print(f"发送命令: {cmd_hex_str}")

    socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    socket.settimeout(3)  # 设置超时时间
    try:
        socket.connect((server_id, server_port))
        response = send_commane_and_receive_response(socket, command)
        if response:
            response_hex_str = " ".join(f"{byte:02X}" for byte in response)
            print(f"收到响应: {response_hex_str}")
            if (len(response) >= 12 and
                response[:4] == PROTOCOL_HEADER and 
                response[4] == CMD_OPEN_ALL_LOCKS and 
                response[5] == board_address):
                status1 = response[6]
                status2 = response[7]
                status3 = response[8]

                print(f">> 板 {board_address} 状态字节1（锁 1-8）：{status1:08b}（0=关门，1=开门）")
                print(f">> 板 {board_address} 状态字节2（锁 9-16）：{status2:08b}（0=关门，1=开门）")
                print(f">> 板 {board_address} 状态字节3（锁 17-24）：{status3:08b}（0=关门，1=开门）")
                
                lock1_status = (status1 >> 0) & 1
                if lock1_status:
                    print(f">> 锁控版 {board_address} 的锁 1 状态：开门（接触开关断开）")
                else:
                    print(f">> 锁控版 {board_address} 的锁 1 状态：关门（接触开关导通）")
            else:
                print("收到的响应格式不正确或与请求不匹配")
        else:
            print("未收到响应")
    except socket.timeout:
        print("连接超时，未收到响应")
    except Exception as e:
        print(f"发生错误: {e}")
    finally:
        socket.close()


if __name__ == "__main__":
    BOARD_ADDR = 1
    LOCK_NUM = 1

    open_single_lock_tcp(SERVER_IP, SERVER_PORT, BOARD_ADDR, LOCK_NUM)