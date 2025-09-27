import { setSelectedColor } from "@/redux/slices/cubeSlice";
import { Button, Card, CardBody } from "@heroui/react";
import { useDispatch } from "react-redux";

const ColorButtons = () => {
    const dispatch = useDispatch();
    return (
        <Card>
            <CardBody className="flex gap-2">
                <Button color="success" variant="solid" onPress={() => dispatch(setSelectedColor(0x00ff00))}>
                    Green
                </Button>
                <Button color="primary" variant="solid" onPress={() => dispatch(setSelectedColor(0x0000ff))}>
                    Blue
                </Button>
                <Button color="secondary" variant="solid" onPress={() => dispatch(setSelectedColor(0x800080))}>
                    Purple
                </Button>
            </CardBody>
        </Card>
    );
}

export default ColorButtons